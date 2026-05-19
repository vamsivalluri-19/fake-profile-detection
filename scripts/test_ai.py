import importlib.util
import json
from pathlib import Path

# Load the ai-model/app.py as a module
spec = importlib.util.spec_from_file_location("mlapp", Path("ai-model") / "app.py")
ml = importlib.util.module_from_spec(spec)
spec.loader.exec_module(ml)

ProfilePayload = ml.ProfilePayload
predict = ml.predict

samples = [
    {
        "username": "vamsi_1912",
        "followersCount": 1200,
        "followingCount": 300,
        "numberOfPosts": 150,
        "bio": "Developer and creator",
        "engagementRate": 3.2,
        "accountAge": 36,
        "instagramUrl": "https://www.instagram.com/vamsi_1912/",
        "twitterUrl": "",
        "linkedinUrl": "",
        "githubUrl": "",
        "snapchatUrl": "",
        "telegramUrl": "",
        "contactNumber": "",
        "websiteUrl": "",
        "tiktokUrl": "",
        "verifiedStatus": False,
        "profilePictureAvailability": True,
    },
    {
        "username": "user_999999",
        "followersCount": 5,
        "followingCount": 1000,
        "numberOfPosts": 1,
        "bio": "",
        "engagementRate": 0.1,
        "accountAge": 1,
        "instagramUrl": "",
        "verifiedStatus": False,
        "profilePictureAvailability": False,
    },
    {
        "username": "founder.nia",
        "followersCount": 5400,
        "followingCount": 430,
        "numberOfPosts": 128,
        "bio": "Speaker and founder",
        "engagementRate": 3.7,
        "accountAge": 51,
        "instagramUrl": "",
        "verifiedStatus": True,
        "profilePictureAvailability": True,
    },
]

for s in samples:
    payload = ProfilePayload(**s)
    r = predict(payload)
    print("INPUT:", s['username'])
    print(json.dumps(r, indent=2))
    print("---")
