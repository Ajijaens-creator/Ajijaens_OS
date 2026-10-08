#!/bin/bash
# Menjalankan seluruh migrasi + pengujian pada Postgres lokal.
# Pemakaian: PGHOST=/tmp PGPORT=5433 PGUSER=postgres ./jalankan_uji.sh [nama_db]
set -e
DB="${1:-ajiostest}"
cd "$(dirname "$0")"
psql -q -c "drop database if exists $DB;" -c "create database $DB;" postgres
for f in migrations/0001_schema.sql migrations/0002_pdp.sql test/shim_lokal.sql migrations/0003_rls.sql migrations/0004_grants.sql migrations/0005_progres.sql migrations/0006_evaluasi.sql; do
  psql -q -v ON_ERROR_STOP=1 -d "$DB" -f "$f" 2>&1 | grep -iv notice || true
done
psql -q -d "$DB" -f test/uji_rls.sql 2>&1 | grep -iv notice | grep -E "^\s+(ok|GAGAL)|lulus, "
