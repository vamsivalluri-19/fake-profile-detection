import importlib.util
from pathlib import Path
import json

spec = importlib.util.spec_from_file_location("mlapp", Path("ai-model") / "app.py")
ml = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ml)

ProfilePayload = ml.ProfilePayload
predict = ml.predict

s = {
    "username": "vamsi_1912",
    "followersCount": 450,
    "followingCount": 320,
    "numberOfPosts": 3,
    "bio": "",
    "engagementRate": 4.2,
    "accountAge": 18,
    "instagramUrl": "https://www.instagram.com/vamsi_1912/",
    "twitterUrl": "",
    "linkedinUrl": "",
    "githubUrl": "",
    "snapchatUrl": "",
    "telegramUrl": "",
    "contactNumber": "6301231575",
    "websiteUrl": "",
    "tiktokUrl": "",
    "verifiedStatus": True,
    "profilePictureAvailability": True,
}

p = ProfilePayload(**s)
r = predict(p)
print(json.dumps(r, indent=2))
