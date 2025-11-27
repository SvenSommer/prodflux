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
    'drf_spectacular',
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
        'DIRS': [BASE_DIR / 'templates'],
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
DATABASE_URL = os.environ.get('DATABASE_URL')

# Test-Umgebung: Immer SQLite für Tests verwenden
import sys
TESTING = 'test' in sys.argv

if TESTING:
    # Für Tests IMMER SQLite verwenden, nie die produktive Datenbank!
    DATABASES = {
        'default': {
            'ENGINE': 'django.db.backends.sqlite3',
            'NAME': ':memory:',  # In-Memory-Datenbank für schnelle Tests
        }
    }
elif DATABASE_URL:
    # Use DATABASE_URL if set (production or local PostgreSQL)
    import dj_database_url
    DATABASES = {
        "default": dj_database_url.parse(DATABASE_URL, conn_max_age=600)
    }
elif RENDER:
    # Production without DATABASE_URL - error
    raise ValueError(
        "DATABASE_URL environment variable is required in production"
    )
else:
    # Local development without DATABASE_URL - use SQLite
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
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

# DRF Spectacular (OpenAPI) Settings
SPECTACULAR_SETTINGS = {
    'TITLE': 'Prodflux API',
    'DESCRIPTION': 'Production and Materials Management System - API Documentation',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'COMPONENT_SPLIT_REQUEST': True,
    'SCHEMA_PATH_PREFIX': r'/api/',
    'SWAGGER_UI_SETTINGS': {
        'deepLinking': True,
        'persistAuthorization': True,
        'displayOperationId': True,
    },
    'AUTHENTICATION_WHITELIST': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'SECURITY': [
        {
            'Bearer': [],
        }
    ],
    'APPEND_COMPONENTS': {
        'securitySchemes': {
            'Bearer': {
                'type': 'http',
                'scheme': 'bearer',
                'bearerFormat': 'JWT',
                'description': 'JWT Authorization header using the Bearer scheme. Example: "Authorization: Bearer {token}"',
            }
        }
    },
}

# CORS
if RENDER:
    CORS_ALLOWED_ORIGINS = [
        "https://prodflux-frontend.onrender.com",
    ]
    CORS_ALLOW_ALL_ORIGINS = False
else:
    CORS_ALLOWED_ORIGINS = [
        "http://localhost:4200",
    ]
    CORS_ALLOW_ALL_ORIGINS = False

# Additional CORS settings for production
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOWED_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# Email Template Configuration (sensitive data from environment)
EMAIL_SENDER_NAME = os.environ.get("EMAIL_SENDER_NAME", "Team")
EMAIL_SENDER_EMAIL = os.environ.get("EMAIL_SENDER_EMAIL", "info@example.com")
EMAIL_SENDER_PHONE = os.environ.get("EMAIL_SENDER_PHONE", "")
EMAIL_COMPANY_NAME = os.environ.get("EMAIL_COMPANY_NAME", "Company")

# Sales Excel Configuration
SALES_EXCEL_URL = os.environ.get("SALES_EXCEL_URL", "")

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
