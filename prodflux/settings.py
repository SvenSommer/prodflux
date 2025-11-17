from dotenv import load_dotenv
import os
from pathlib import Path
from datetime import timedelta

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(dotenv_path=BASE_DIR / '.env')

# Beispiel-Zugriff auf die Variablen
WOOCOMMERCE_API_URL = os.getenv('WOOCOMMERCE_API_URL')
WOOCOMMERCE_CONSUMER_KEY = os.getenv('WOOCOMMERCE_CONSUMER_KEY')
WOOCOMMERCE_CONSUMER_SECRET = os.getenv('WOOCOMMERCE_CONSUMER_SECRET')


# Environment Flags
RENDER = os.environ.get("RENDER") is not None
RENDER_EXTERNAL_HOSTNAME = os.environ.get("RENDER_EXTERNAL_HOSTNAME")

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key-only-for-local")

DEBUG = os.environ.get("DEBUG", "True") == "True"

ALLOWED_HOSTS = []
if RENDER_EXTERNAL_HOSTNAME:
    ALLOWED_HOSTS.append(RENDER_EXTERNAL_HOSTNAME)
else:
    ALLOWED_HOSTS.append("localhost")
    ALLOWED_HOSTS.append("127.0.0.1")

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'core',
    'materials',
    'products',
    'manufacturing',
    'rest_framework',
    'corsheaders',
    'shopbridge',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # Für statische Dateien auf Render
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'prodflux.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'prodflux.wsgi.application'

# Datenbank
if RENDER:
    import dj_database_url
    DATABASES = {
        "default": dj_database_url.config(conn_max_age=600)
    }
else:
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': BASE_DIR / 'db.sqlite3',
        }
    }

# Passwort-Validierung
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# Internationalisierung
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Statische & Medien-Dateien
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Frontend statische Dateien
FRONTEND_ROOT = (BASE_DIR / 'prodflux-frontend' / 'dist' /
                 'prodflux-frontend' / 'browser')

# Zusätzliche Verzeichnisse für statische Dateien
STATICFILES_DIRS = [
    FRONTEND_ROOT,
] if FRONTEND_ROOT.exists() else []

# WhiteNoise configuration for SPA support
if RENDER:
    # Configure WhiteNoise to handle SPA fallback
    WHITENOISE_INDEX_FILE = True
    # Don't let WhiteNoise serve index.html at all routes
    # We handle SPA routing in our views

MEDIA_URL = '/media/'
if RENDER:
    MEDIA_ROOT = '/media'  # Pfad zur Persistent Disk bei Render
else:
    MEDIA_ROOT = BASE_DIR / 'media'  # Lokal weiterhin normal

# Custom User Model
AUTH_USER_MODEL = 'core.User'

# JWT Konfiguration
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(days=7),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=30),
    'ROTATE_REFRESH_TOKENS': False,
    'BLACKLIST_AFTER_ROTATION': False,
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# Django REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
}

# CORS
CORS_ALLOWED_ORIGINS = [
    "http://localhost:4200",
    "https://prodflux-frontend.onrender.com",  
]
CORS_ALLOW_ALL_ORIGINS = False

# Logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {'class': 'logging.StreamHandler'},
    },
    'root': {
        'handlers': ['console'],
        'level': 'DEBUG' if DEBUG else 'INFO',
    },
}
