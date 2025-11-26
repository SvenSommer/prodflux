# Prodflux Database Management Scripts

⚠️ **SECURITY WARNING**: These scripts contain sensitive production database credentials and are excluded from Git.

## Available Scripts

### Production Database Management

These scripts are **NOT committed to Git** because they contain production credentials:

- `pull_prod_db.sh` - Download production database from Render.com
- `restore_prod_db.sh` - Restore a database dump to local PostgreSQL
- `switch_to_prod_db.sh` - Complete workflow: download, restore, and configure
- `update_prod_db.sh` - Update local database with latest production data and restart servers

### Safe Scripts (Committed to Git)

These scripts are safe to commit and don't contain credentials:

- `seed_material_categories.py` - Seed material categories
- `seed_materials.py` - Seed materials data

## Creating Production Database Scripts

If you need to recreate the production database scripts on a new machine:

1. Get the production database credentials from Render.com dashboard
2. Create the scripts manually using the credentials
3. Make sure they are listed in `.gitignore`

## Security Best Practices

1. **Never commit production credentials to Git**
2. **Always use `.env` files for sensitive data**
3. **Keep database backups in the `backups/` folder** (also excluded from Git)
4. **Use `.env.example` to document required environment variables**

## Backup Management

All database backups are stored in the `backups/` folder:
- `prod_dump_*.sql` - Production database dumps
- `local_prod_backup_*.sql` - Local database backups before updates
- `local_backup_*.sqlite3` - SQLite database backups

**Note**: The `backups/` folder is excluded from Git to prevent accidentally committing production data.
