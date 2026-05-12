import os
from dataclasses import dataclass


@dataclass
class OAuthProvider:
    name: str
    client_id: str
    client_secret: str
    authorize_url: str
    token_url: str
    userinfo_url: str
    scope: str
    email_field: str = "email"
    first_name_field: str = "given_name"
    last_name_field: str = "family_name"


def _env(key: str) -> str:
    return os.getenv(key, "")


OAUTH_PROVIDERS: dict[str, OAuthProvider] = {}

if _env("GOOGLE_CLIENT_ID") and _env("GOOGLE_CLIENT_SECRET"):
    OAUTH_PROVIDERS["google"] = OAuthProvider(
        name="Google",
        client_id=_env("GOOGLE_CLIENT_ID"),
        client_secret=_env("GOOGLE_CLIENT_SECRET"),
        authorize_url="https://accounts.google.com/o/oauth2/v2/auth",
        token_url="https://oauth2.googleapis.com/token",
        userinfo_url="https://www.googleapis.com/oauth2/v3/userinfo",
        scope="openid email profile",
    )

# To add CVUT OAuth, fill in your credentials and uncomment:
# if _env("CVUT_CLIENT_ID") and _env("CVUT_CLIENT_SECRET"):
#     OAUTH_PROVIDERS["cvut"] = OAuthProvider(
#         name="CVUT",
#         client_id=_env("CVUT_CLIENT_ID"),
#         client_secret=_env("CVUT_CLIENT_SECRET"),
#         authorize_url="https://auth.fit.cvut.cz/auth/realms/cvut/protocol/openid-connect/auth",
#         token_url="https://auth.fit.cvut.cz/auth/realms/cvut/protocol/openid-connect/token",
#         userinfo_url="https://auth.fit.cvut.cz/auth/realms/cvut/protocol/openid-connect/userinfo",
#         scope="openid email profile",
#     )
