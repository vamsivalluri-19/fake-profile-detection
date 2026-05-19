from __future__ import annotations

import math
import re
from collections import Counter
import datetime
from typing import Dict, List

import numpy as np
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier

app = FastAPI(title='Fake Profile Detection AI', version='1.0.0')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

class ProfilePayload(BaseModel):
    username: str
    followersCount: float = Field(ge=0)
    followingCount: float = Field(ge=0)
    numberOfPosts: float = Field(ge=0)
    bio: str | None = ''
    engagementRate: float = Field(ge=0)
    accountAge: float = Field(ge=0)
    instagramUrl: str | None = ''
    twitterUrl: str | None = ''
    linkedinUrl: str | None = ''
    githubUrl: str | None = ''
    snapchatUrl: str | None = ''
    telegramUrl: str | None = ''
    contactNumber: str | None = ''
    websiteUrl: str | None = ''
    tiktokUrl: str | None = ''
    verifiedStatus: bool
    profilePictureAvailability: bool


def is_present(value: str | None) -> bool:
    return bool(value and str(value).strip())


def count_social_links(payload: ProfilePayload) -> int:
    fields = [
        payload.instagramUrl,
        payload.twitterUrl,
        payload.linkedinUrl,
        payload.githubUrl,
        payload.snapchatUrl,
        payload.telegramUrl,
        payload.websiteUrl,
        payload.tiktokUrl,
    ]
    return sum(1 for field in fields if is_present(field))


def parse_domain_info(url: str | None, username: str) -> Dict[str, object]:
    """Basic domain heuristics without external network calls.

    Returns: {https: bool, domain_len: int, shortener: bool, username_in_domain: bool}
    """
    if not url:
        return {'https': False, 'domain_len': 0, 'shortener': False, 'username_in_domain': False}
    try:
        s = str(url).strip()
        https = s.lower().startswith('https://')
        # strip protocol and path
        domain = s.split('://')[-1].split('/')[0].lower()
        # remove possible www
        if domain.startswith('www.'):
            domain = domain[4:]
        domain_len = len(domain)
        # common shorteners
        shorteners = ['bit.ly', 't.co', 'tinyurl.com', 'goo.gl', 'ow.ly']
        shortener = any(d in domain for d in shorteners)
        username_in_domain = username.lower() in domain
        return {'https': https, 'domain_len': domain_len, 'shortener': shortener, 'username_in_domain': username_in_domain}
    except Exception:
        return {'https': False, 'domain_len': 0, 'shortener': False, 'username_in_domain': False}


def normalize_for_compare(s: str) -> str:
    s = (s or '').lower()
    # replace common homoglyphs and noisy characters
    s = s.replace('0', 'o').replace('1', 'l').replace('@', 'a').replace('$', 's')
    s = s.replace('rn', 'm')
    # keep only alphanumerics
    return ''.join(ch for ch in s if ch.isalnum())


def detect_bio_keywords(bio: str | None) -> int:
    if not bio:
        return 0
    bio_text = bio.lower()
    keywords = [
        'dm for', 'giveaway', 'followers', 'free followers', 'buy followers', 'earn money', 'click link',
        'crypto', 'investment', 'guarantee', 'buy', 'subscribe', 'promo', 'discount', 'verify', 'official',
    ]
    count = 0
    for kw in keywords:
        if kw in bio_text:
            count += 1
    return count


def url_lookalike_score(url: str | None, platform_hint: str | None = None) -> float:
    """Return 0..1 score indicating how suspicious the url looks compared to common official domains.

    Simple heuristic: if domain contains known suspicious tokens or looks like a near-match to a major platform but is not the official domain, increase score.
    """
    if not url:
        return 0.0
    try:
        domain = str(url).split('://')[-1].split('/')[0].lower()
    except Exception:
        domain = str(url or '').lower()

    short_tokens = ['secure', 'login', 'verify', 'account', 'update', 'confirm', 'support', 'auth']
    score = 0
    for t in short_tokens:
        if t in domain:
            score += 1

    # platform lookalike check
    official = {
        'instagram': 'instagram.com',
        'facebook': 'facebook.com',
        'linkedin': 'linkedin.com',
        'twitter': 'twitter.com',
    }
    # normalize domain for fuzzy compare
    norm = normalize_for_compare(domain)
    for name, off in official.items():
        off_norm = normalize_for_compare(off)
        if name in (platform_hint or '') or name in domain or off_norm in norm:
            # if domain is not exactly the official domain but contains the platform name, it's suspicious
            if off not in domain and (name in domain or name in norm):
                score += 2
    # shortener check
    if any(s in domain for s in ['bit.ly', 't.co', 'tinyurl', 'goo.gl', 'ow.ly']):
        score += 2

    # normalize to 0..1 with cap at 6
    return min(score / 6.0, 1.0)


def build_features(payload: ProfilePayload) -> List[float]:
    followers = float(payload.followersCount)
    following = max(float(payload.followingCount), 1.0)
    posts = float(payload.numberOfPosts)
    engagement = float(payload.engagementRate)
    age = float(payload.accountAge)
    verified = 1.0 if payload.verifiedStatus else 0.0
    picture = 1.0 if payload.profilePictureAvailability else 0.0
    bio = (payload.bio or '').strip()
    username = payload.username.lower().strip()
    social_link_count = float(count_social_links(payload))
    contact_present = 1.0 if is_present(payload.contactNumber) else 0.0

    # website/domain derived features
    domain_info = parse_domain_info(payload.websiteUrl or '', username)
    https_flag = 1.0 if domain_info.get('https') else 0.0
    domain_len = float(domain_info.get('domain_len', 0))
    # normalize domain length into a 0..1 by capping at 40
    domain_len_norm = min(domain_len / 40.0, 1.0)
    shortener_flag = 1.0 if domain_info.get('shortener') else 0.0
    username_in_domain = 1.0 if domain_info.get('username_in_domain') else 0.0

    # bio keyword signals
    bio_kw_count = float(detect_bio_keywords(bio))

    # posts per month (approx)
    posts_per_month = float(posts / max(age, 1.0))

    # followers -> engagement ratio
    expected_engagement = max((engagement / 100.0) * followers, 1.0)
    follower_to_engagement = float(followers / expected_engagement)

    # URL lookalike suspicion score
    url_lookalike = float(url_lookalike_score(payload.websiteUrl, platform_hint=None))

    followers_following_ratio = followers / following
    profile_completeness = (
        (1.0 if bio else 0.0)
        + picture
        + verified
        + (1.0 if posts > 9 else 0.0)
        + min(social_link_count, 4.0) / 4.0
        + contact_present
    ) / 6.0
    # Treat long numeric sequences as suspicious, but ignore 4-digit sequences that look like years
    suspicious_username = 0.0
    num_seqs = re.findall(r'\d{4,}', username)
    if num_seqs:
        current_year = datetime.datetime.now().year
        for seq in num_seqs:
            try:
                n = int(seq)
                # if the 4+ digit sequence is within plausible year range, consider it non-suspicious
                if 1900 <= n <= current_year:
                    continue
                suspicious_username = 1.0
                break
            except Exception:
                suspicious_username = 1.0
                break
    elif username.count('.') > 2:
        suspicious_username = 1.0
    bio_length = min(len(bio) / 160.0, 1.0)
    log_followers = math.log10(followers + 1.0)
    log_following = math.log10(following + 1.0)

    return [
        followers_following_ratio,
        profile_completeness,
        age,
        suspicious_username,
        engagement,
        bio_length,
        log_followers,
        log_following,
        verified,
        picture,
        posts,
        social_link_count,
        contact_present,
        https_flag,
        domain_len_norm,
        shortener_flag,
        username_in_domain,
        bio_kw_count,
        posts_per_month,
        follower_to_engagement,
        url_lookalike,
    ]


def synthetic_dataset() -> tuple[np.ndarray, np.ndarray]:
    samples: List[List[float]] = []
    labels: List[int] = []

    seed_rows: List[Dict[str, object]] = [
        # Real profiles
        {'label': 0, 'followersCount': 1200, 'followingCount': 260, 'numberOfPosts': 84, 'bio': 'Travel creator', 'engagementRate': 4.8, 'accountAge': 34, 'verifiedStatus': True, 'profilePictureAvailability': True, 'username': 'lena.world', 'websiteUrl': 'https://lena.world', 'instagramUrl': 'https://instagram.com/lena.world', 'twitterUrl': 'https://x.com/lena_world'},
        {'label': 0, 'followersCount': 8200, 'followingCount': 210, 'numberOfPosts': 301, 'bio': 'Tech and AI insights', 'engagementRate': 5.2, 'accountAge': 44, 'verifiedStatus': True, 'profilePictureAvailability': True, 'username': 'ai.sahana', 'websiteUrl': 'https://aisahana.ai', 'linkedinUrl': 'https://linkedin.com/in/aisahana'},
        {'label': 0, 'followersCount': 340, 'followingCount': 355, 'numberOfPosts': 27, 'bio': 'Food photographer', 'engagementRate': 2.1, 'accountAge': 19, 'verifiedStatus': False, 'profilePictureAvailability': True, 'username': 'chefmila', 'websiteUrl': 'https://chefmila.com', 'instagramUrl': 'https://instagram.com/chefmila'},
        {'label': 0, 'followersCount': 5400, 'followingCount': 430, 'numberOfPosts': 128, 'bio': 'Speaker and founder', 'engagementRate': 3.7, 'accountAge': 51, 'verifiedStatus': True, 'profilePictureAvailability': True, 'username': 'founder.nia', 'websiteUrl': 'https://foundernia.com', 'linkedinUrl': 'https://linkedin.com/in/foundernia'},
        {'label': 0, 'followersCount': 960, 'followingCount': 190, 'numberOfPosts': 61, 'bio': 'Fashion + lifestyle', 'engagementRate': 2.7, 'accountAge': 22, 'verifiedStatus': False, 'profilePictureAvailability': True, 'username': 'stylebyara', 'websiteUrl': 'https://stylebyara.com', 'instagramUrl': 'https://instagram.com/stylebyara'},
        {'label': 0, 'followersCount': 1850, 'followingCount': 220, 'numberOfPosts': 74, 'bio': 'Building products and sharing lessons', 'engagementRate': 3.4, 'accountAge': 29, 'verifiedStatus': False, 'profilePictureAvailability': True, 'username': 'product.aria', 'websiteUrl': 'https://productaria.com', 'githubUrl': 'https://github.com/productaria'},
        {'label': 0, 'followersCount': 4100, 'followingCount': 510, 'numberOfPosts': 152, 'bio': 'Personal brand and speaking', 'engagementRate': 2.9, 'accountAge': 37, 'verifiedStatus': True, 'profilePictureAvailability': True, 'username': 'maria.speaks', 'websiteUrl': 'https://mariaspeaks.com', 'instagramUrl': 'https://instagram.com/mariaspeaks', 'linkedinUrl': 'https://linkedin.com/in/mariaspeaks'},
        {'label': 0, 'followersCount': 760, 'followingCount': 140, 'numberOfPosts': 53, 'bio': 'Local business updates', 'engagementRate': 2.6, 'accountAge': 24, 'verifiedStatus': False, 'profilePictureAvailability': True, 'username': 'northside.store', 'websiteUrl': 'https://northsidestore.com', 'contactNumber': '+15551234567'},
        {'label': 0, 'followersCount': 22000, 'followingCount': 300, 'numberOfPosts': 640, 'bio': 'Official company account', 'engagementRate': 4.5, 'accountAge': 72, 'verifiedStatus': True, 'profilePictureAvailability': True, 'username': 'brandhq', 'websiteUrl': 'https://brandhq.com', 'instagramUrl': 'https://instagram.com/brandhq', 'linkedinUrl': 'https://linkedin.com/company/brandhq'},
        {'label': 0, 'followersCount': 1400, 'followingCount': 180, 'numberOfPosts': 90, 'bio': 'Artist and designer', 'engagementRate': 3.0, 'accountAge': 33, 'verifiedStatus': False, 'profilePictureAvailability': True, 'username': 'studio.ella', 'websiteUrl': 'https://ella-studio.com'},
        {'label': 0, 'followersCount': 630, 'followingCount': 120, 'numberOfPosts': 41, 'bio': 'Research and writing', 'engagementRate': 2.4, 'accountAge': 21, 'verifiedStatus': False, 'profilePictureAvailability': True, 'username': 'research.nit', 'websiteUrl': 'https://researchnit.org'},
        {'label': 0, 'followersCount': 3200, 'followingCount': 290, 'numberOfPosts': 115, 'bio': 'Community organizer', 'engagementRate': 3.1, 'accountAge': 48, 'verifiedStatus': True, 'profilePictureAvailability': True, 'username': 'community.rin', 'websiteUrl': 'https://communityrin.org', 'telegramUrl': 'https://t.me/communityrin'},

        # Fake / suspicious profiles
        {'label': 1, 'followersCount': 58, 'followingCount': 910, 'numberOfPosts': 2, 'bio': '', 'engagementRate': 0.3, 'accountAge': 2, 'verifiedStatus': False, 'profilePictureAvailability': False, 'username': 'user_93821'},
        {'label': 1, 'followersCount': 16, 'followingCount': 2, 'numberOfPosts': 0, 'bio': 'DM for collab', 'engagementRate': 0.1, 'accountAge': 1, 'verifiedStatus': False, 'profilePictureAvailability': False, 'username': 'promo_offer1234'},
        {'label': 1, 'followersCount': 45, 'followingCount': 1480, 'numberOfPosts': 4, 'bio': '', 'engagementRate': 0.2, 'accountAge': 3, 'verifiedStatus': False, 'profilePictureAvailability': False, 'username': 'random99999'},
        {'label': 1, 'followersCount': 72, 'followingCount': 640, 'numberOfPosts': 1, 'bio': 'New account', 'engagementRate': 0.4, 'accountAge': 2, 'verifiedStatus': False, 'profilePictureAvailability': True, 'username': 'john_20257'},
        {'label': 1, 'followersCount': 8, 'followingCount': 800, 'numberOfPosts': 0, 'bio': '', 'engagementRate': 0.1, 'accountAge': 1, 'verifiedStatus': False, 'profilePictureAvailability': False, 'username': 'a12b34c56', 'websiteUrl': 'http://bit.ly/short'},
        {'label': 1, 'followersCount': 34, 'followingCount': 1200, 'numberOfPosts': 1, 'bio': 'Verify your account now', 'engagementRate': 0.2, 'accountAge': 1, 'verifiedStatus': False, 'profilePictureAvailability': False, 'username': 'instagram_support_official', 'websiteUrl': 'http://secure-login-instagram.example.com'},
        {'label': 1, 'followersCount': 27, 'followingCount': 845, 'numberOfPosts': 0, 'bio': 'Free followers and crypto giveaways', 'engagementRate': 0.05, 'accountAge': 1, 'verifiedStatus': False, 'profilePictureAvailability': False, 'username': 'giveaway_cash8888', 'websiteUrl': 'http://tinyurl.com/free-win'},
        {'label': 1, 'followersCount': 84, 'followingCount': 999, 'numberOfPosts': 3, 'bio': 'Click link for bonus', 'engagementRate': 0.4, 'accountAge': 2, 'verifiedStatus': False, 'profilePictureAvailability': False, 'username': 'secure_login_2024', 'websiteUrl': 'http://instagram-secure-login.net'},
        {'label': 1, 'followersCount': 14, 'followingCount': 610, 'numberOfPosts': 0, 'bio': 'Official support account', 'engagementRate': 0.1, 'accountAge': 1, 'verifiedStatus': False, 'profilePictureAvailability': False, 'username': 'brand_support_92818', 'websiteUrl': 'http://brandhq-support.xyz'},
        {'label': 1, 'followersCount': 19, 'followingCount': 420, 'numberOfPosts': 2, 'bio': 'earn money fast', 'engagementRate': 0.15, 'accountAge': 1, 'verifiedStatus': False, 'profilePictureAvailability': False, 'username': 'makemoney_123456', 'websiteUrl': 'http://bit.ly/earn-now'},
        {'label': 1, 'followersCount': 61, 'followingCount': 760, 'numberOfPosts': 1, 'bio': 'discount and promo updates', 'engagementRate': 0.25, 'accountAge': 2, 'verifiedStatus': False, 'profilePictureAvailability': False, 'username': 'promo.discount.sale', 'websiteUrl': 'http://verify-account-login.com'},
        {'label': 1, 'followersCount': 22, 'followingCount': 580, 'numberOfPosts': 0, 'bio': 'DM me for collab and followers', 'engagementRate': 0.08, 'accountAge': 1, 'verifiedStatus': False, 'profilePictureAvailability': False, 'username': 'growth_hack_7777', 'websiteUrl': 'http://support-verify-now.ru'},
    ]

    def make_payload(row: Dict[str, object]) -> ProfilePayload:
        return ProfilePayload(
            username=str(row.get('username', 'user')),
            followersCount=float(row.get('followersCount', 0)),
            followingCount=float(row.get('followingCount', 1)),
            numberOfPosts=float(row.get('numberOfPosts', 0)),
            bio=str(row.get('bio', '')),
            engagementRate=float(row.get('engagementRate', 0)),
            accountAge=float(row.get('accountAge', 0)),
            instagramUrl=str(row.get('instagramUrl', '')),
            twitterUrl=str(row.get('twitterUrl', '')),
            linkedinUrl=str(row.get('linkedinUrl', '')),
            githubUrl=str(row.get('githubUrl', '')),
            snapchatUrl=str(row.get('snapchatUrl', '')),
            telegramUrl=str(row.get('telegramUrl', '')),
            contactNumber=str(row.get('contactNumber', '')),
            websiteUrl=str(row.get('websiteUrl', '')),
            tiktokUrl=str(row.get('tiktokUrl', '')),
            verifiedStatus=bool(row.get('verifiedStatus', False)),
            profilePictureAvailability=bool(row.get('profilePictureAvailability', False)),
        )

    def add_sample(row: Dict[str, object]) -> None:
        payload = make_payload(row)
        samples.append(build_features(payload))
        labels.append(int(row['label']))

    def jitter_rows(row: Dict[str, object]) -> List[Dict[str, object]]:
        if row.get('verifiedStatus'):
            variations = [
                {'followersCount': 0.92, 'followingCount': 1.05, 'numberOfPosts': 1.08, 'engagementRate': 1.04, 'accountAge': 1.1},
                {'followersCount': 1.08, 'followingCount': 0.95, 'numberOfPosts': 0.92, 'engagementRate': 0.96, 'accountAge': 0.9},
            ]
        else:
            variations = [
                {'followersCount': 0.85, 'followingCount': 1.15, 'numberOfPosts': 0.8, 'engagementRate': 0.75, 'accountAge': 0.85},
                {'followersCount': 1.12, 'followingCount': 1.08, 'numberOfPosts': 1.2, 'engagementRate': 1.1, 'accountAge': 1.05},
            ]
        rows: List[Dict[str, object]] = []
        for variant in variations:
            copy_row = dict(row)
            copy_row['followersCount'] = max(0.0, float(row.get('followersCount', 0)) * variant['followersCount'])
            copy_row['followingCount'] = max(1.0, float(row.get('followingCount', 1)) * variant['followingCount'])
            copy_row['numberOfPosts'] = max(0.0, float(row.get('numberOfPosts', 0)) * variant['numberOfPosts'])
            copy_row['engagementRate'] = max(0.0, float(row.get('engagementRate', 0)) * variant['engagementRate'])
            copy_row['accountAge'] = max(0.0, float(row.get('accountAge', 0)) * variant['accountAge'])
            rows.append(copy_row)
        return rows

    for row in seed_rows:
        add_sample(row)
        for variant_row in jitter_rows(row):
            add_sample(variant_row)

    return np.array(samples, dtype=float), np.array(labels, dtype=int)


def train_models(extra_samples: List[Dict[str, object]] | None = None):
    """Train models using synthetic dataset plus optional extra labeled samples.

    extra_samples: list of dicts matching ProfilePayload fields plus 'label' (1 for fake, 0 for real).
    """
    X, y = synthetic_dataset()

    # incorporate any extra labeled samples to improve realism
    if extra_samples:
        more_X = []
        more_y = []
        for row in extra_samples:
            try:
                payload = ProfilePayload(
                    username=str(row.get('username', 'user')),
                    followersCount=float(row.get('followersCount', 0)),
                    followingCount=float(row.get('followingCount', 1)),
                    numberOfPosts=float(row.get('numberOfPosts', 0)),
                    bio=str(row.get('bio', '')),
                    engagementRate=float(row.get('engagementRate', 0)),
                    accountAge=float(row.get('accountAge', 0)),
                    instagramUrl=str(row.get('instagramUrl', '')),
                    twitterUrl=str(row.get('twitterUrl', '')),
                    linkedinUrl=str(row.get('linkedinUrl', '')),
                    githubUrl=str(row.get('githubUrl', '')),
                    snapchatUrl=str(row.get('snapchatUrl', '')),
                    telegramUrl=str(row.get('telegramUrl', '')),
                    contactNumber=str(row.get('contactNumber', '')),
                    websiteUrl=str(row.get('websiteUrl', '')),
                    tiktokUrl=str(row.get('tiktokUrl', '')),
                    verifiedStatus=bool(row.get('verifiedStatus', False)),
                    profilePictureAvailability=bool(row.get('profilePictureAvailability', False)),
                )
                feats = build_features(payload)
                more_X.append(feats)
                lbl = int(row.get('label', 0))
                more_y.append(lbl)
            except Exception:
                continue
        if more_X:
            X = np.vstack([X, np.array(more_X, dtype=float)])
            y = np.concatenate([y, np.array(more_y, dtype=int)])

    # shuffle and split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

    new_models = {
        'logistic_regression': LogisticRegression(max_iter=3000, class_weight='balanced'),
        'random_forest': RandomForestClassifier(n_estimators=600, random_state=42, class_weight='balanced'),
        'decision_tree': DecisionTreeClassifier(max_depth=7, random_state=42, class_weight='balanced'),
    }

    for model in new_models.values():
        model.fit(X_train, y_train)

    # expose new models and training stats
    global models
    models = new_models
    return {'trained_samples': int(X.shape[0]), 'train_pos': int(y.sum()), 'train_neg': int((y == 0).sum())}


# initial training
models = {}
train_stats = train_models()


def explain_prediction(payload: ProfilePayload, features: List[float]) -> List[str]:
    (
        ratio,
        completeness,
        age,
        suspicious_username,
        engagement,
        bio_length,
        log_followers,
        log_following,
        verified,
        picture,
        posts,
        social_link_count,
        contact_present,
        https_flag,
        domain_len_norm,
        shortener_flag,
        username_in_domain,
        bio_kw_count,
        posts_per_month,
        follower_to_engagement,
        url_lookalike,
    ) = features
    reasons: List[str] = []

    if ratio < 0.35:
        reasons.append('Low followers-to-following ratio')
    if completeness < 0.5:
        reasons.append('Profile appears incomplete')
    if age < 6:
        reasons.append('Very young account age')
    if suspicious_username > 0:
        reasons.append('Username contains suspicious numeric pattern')
    if engagement < 1.0:
        reasons.append('Low engagement rate')
    if posts < 5:
        reasons.append('Very small post history')
    if social_link_count < 2:
        reasons.append('Very few social media links')
    if not contact_present:
        reasons.append('No contact number provided')
    if not payload.profilePictureAvailability:
        reasons.append('No profile picture')
    if not payload.verifiedStatus:
        reasons.append('Not verified')
    # website reasons
    if shortener_flag:
        reasons.append('Website uses a URL shortener (may be obfuscated)')
    if not https_flag and payload.websiteUrl:
        reasons.append('Website is not HTTPS')
    if username_in_domain:
        reasons.append('Username appears in linked website domain')
    if bio_kw_count > 0:
        reasons.append('Bio contains promotional or suspicious keywords')
    if url_lookalike and url_lookalike > 0.4:
        reasons.append('Linked URL looks like a phishing or lookalike domain')

    return reasons or ['Profile metrics are consistent with a real account']


def calculate_heuristic_score(payload: ProfilePayload, features: List[float]) -> int:
    (
        ratio,
        completeness,
        age,
        suspicious_username,
        engagement,
        bio_length,
        log_followers,
        log_following,
        verified,
        picture,
        posts,
        social_link_count,
        contact_present,
        https_flag,
        domain_len_norm,
        shortener_flag,
        username_in_domain,
        bio_kw_count,
        posts_per_month,
        follower_to_engagement,
        url_lookalike,
    ) = features
    score = 0

    if ratio < 0.35:
        score += 1
    if completeness < 0.5:
        score += 1
    if age < 6:
        score += 1
    if suspicious_username > 0:
        score += 1
    if engagement < 1.0:
        score += 1
    if posts < 5:
        score += 1
    if social_link_count < 2:
        score += 1
    if not contact_present:
        score += 1
    if not payload.profilePictureAvailability:
        score += 1
    if not payload.verifiedStatus:
        score += 1

    # website heuristics
    if shortener_flag:
        score += 1
    if not https_flag and payload.websiteUrl:
        score += 1
    # very short domain names (could be suspicious)
    if domain_len_norm < 0.12 and domain_len_norm > 0:
        score += 1
    if bio_kw_count >= 1:
        score += 1
    if posts_per_month < 0.5:
        score += 1
    if follower_to_engagement > 10:
        score += 1
    if url_lookalike > 0.4:
        score += 1
    # username in domain reduces suspicion
    if username_in_domain:
        score = max(0, score - 1)

    return score


def calculate_real_support_score(payload: ProfilePayload, features: List[float]) -> int:
    (
        ratio,
        completeness,
        age,
        suspicious_username,
        engagement,
        bio_length,
        log_followers,
        log_following,
        verified,
        picture,
        posts,
        social_link_count,
        contact_present,
        https_flag,
        domain_len_norm,
        shortener_flag,
        username_in_domain,
        bio_kw_count,
        posts_per_month,
        follower_to_engagement,
        url_lookalike,
    ) = features
    score = 0

    if ratio >= 0.5:
        score += 1
    if completeness >= 0.75:
        score += 1
    if age >= 12:
        score += 1
    if engagement >= 2.0:
        score += 1
    if posts >= 30:
        score += 1
    if posts >= 100:
        score += 1
    if social_link_count >= 2:
        score += 1
    if contact_present:
        score += 1
    if payload.profilePictureAvailability:
        score += 1
    if payload.verifiedStatus:
        score += 1
    # website positive signals
    if https_flag:
        score += 1
    if username_in_domain:
        score += 1
    if not shortener_flag and payload.websiteUrl:
        score += 1
    if bio_kw_count == 0:
        score += 1
    if posts_per_month >= 1.0:
        score += 1
    if follower_to_engagement < 5:
        score += 1
    if url_lookalike < 0.2:
        score += 1

    return score


@app.get('/health')
def health():
    return {'status': 'ok', 'service': 'fake-profile-detection-ai'}


@app.post('/predict')
def predict(payload: ProfilePayload):
    features = build_features(payload)
    inputs = np.array([features], dtype=float)
    heuristic_score = calculate_heuristic_score(payload, features)
    real_support_score = calculate_real_support_score(payload, features)
    verified_high_activity = (
        payload.verifiedStatus
        and payload.numberOfPosts >= 100
        and payload.accountAge >= 12
        and features[0] >= 0.4
        and features[4] >= 1.5
    )
    # ensemble probabilities and votes
    probabilities = []
    votes = []
    for name, model in models.items():
        try:
            prob = float(model.predict_proba(inputs)[0][1])
        except Exception:
            prob = 0.5
        prediction = int(prob >= 0.5)
        probabilities.append(prob)
        votes.append(prediction)

    averaged_probability = float(np.mean(probabilities)) if probabilities else 0.5
    vote_prediction = Counter(votes).most_common(1)[0][0] if votes else 0

    # improved decision logic: prefer real_support_score and averaged_probability, but keep heuristics
    if verified_high_activity:
        final_prediction = 'Real'
    elif real_support_score >= 6 and heuristic_score <= 6:
        final_prediction = 'Real'
    elif heuristic_score >= 5:
        final_prediction = 'Fake'
    elif averaged_probability >= 0.6 or vote_prediction == 1:
        final_prediction = 'Fake'
    elif averaged_probability >= 0.45 and heuristic_score >= 3:
        final_prediction = 'Fake'
    else:
        final_prediction = 'Real'

    # confidence: map averaged_probability into an interpretable confidence and bias toward safer bounds
    if final_prediction == 'Fake':
        confidence = round(max(55.0, min(averaged_probability * 100 + heuristic_score * 2, 99.5)), 2)
    else:
        confidence = round(max(55.0, min((1 - averaged_probability) * 100 + real_support_score * 2, 99.5)), 2)

    risk_level = 'High' if confidence >= 80 else 'Medium' if confidence >= 65 else 'Low'
    reasons = explain_prediction(payload, features)

    # Safety override: avoid returning 'Fake' when the overall risk level is Low
    # This prevents confusing outputs like "Prediction: Fake" with a Low risk score.
    if final_prediction == 'Fake' and risk_level == 'Low':
        # only override if heuristics and ensemble are not strongly indicating fake
        if heuristic_score < 5 and averaged_probability < 0.6:
            final_prediction = 'Real'
            # adjust confidence to reflect Real mapping
            confidence = round(max(55.0, min((1 - averaged_probability) * 100 + real_support_score * 2, 99.5)), 2)
            # add an explanatory reason at the top
            if 'Low overall risk score prevented a hard Fake classification' not in reasons:
                reasons.insert(0, 'Low overall risk score prevented a hard Fake classification')
            # keep risk_level as Low

    if heuristic_score >= 4 and 'Heuristic risk score indicates a suspicious profile' not in reasons:
        reasons.insert(0, 'Heuristic risk score indicates a suspicious profile')
    if real_support_score >= 5 and 'Strong real-profile activity signals detected' not in reasons:
        reasons.insert(0, 'Strong real-profile activity signals detected')
    if verified_high_activity and 'Verified high-activity profile override applied' not in reasons:
        reasons.insert(0, 'Verified high-activity profile override applied')

    # Enforce: if overall computed risk is High, prefer a 'Fake' label unless a verified-high-activity override applies.
    # This prevents inconsistent outputs like 'Real' with a High riskLevel.
    url_lookalike = features[20] if len(features) > 20 else 0.0
    if risk_level == 'High' and final_prediction == 'Real' and not verified_high_activity:
        if heuristic_score >= 4 or averaged_probability >= 0.65 or url_lookalike > 0.45:
            final_prediction = 'Fake'
            confidence = round(max(55.0, min(averaged_probability * 100 + heuristic_score * 2, 99.5)), 2)
            if 'High overall risk score forced a Fake classification' not in reasons:
                reasons.insert(0, 'High overall risk score forced a Fake classification')
    if final_prediction == 'Real':
        confidence = round(max(55.0, min((1 - averaged_probability) * 100, 99.5)), 2)

    return {
        'prediction': final_prediction,
        'confidence': confidence,
        'riskLevel': risk_level,
        'reasons': reasons,
        'heuristicScore': heuristic_score,
        'realSupportScore': real_support_score,
        'modelBreakdown': {
            'logisticRegression': round(probabilities[0] * 100, 2) if len(probabilities) > 0 else None,
            'randomForest': round(probabilities[1] * 100, 2) if len(probabilities) > 1 else None,
            'decisionTree': round(probabilities[2] * 100, 2) if len(probabilities) > 2 else None,
        },
    }


@app.post('/retrain')
def retrain(payload: Dict[str, object] | None = None):
    """Retrain models. Optionally accepts JSON body with 'samples': [{..fields.., 'label':0|1}, ...]."""
    samples = None
    if payload and isinstance(payload, dict):
        samples = payload.get('samples')
    stats = train_models(extra_samples=samples)
    return {'status': 'ok', 'stats': stats}
