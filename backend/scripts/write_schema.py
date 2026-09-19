#!/usr/bin/env python3
"""Script to write the Prisma schema in chunks"""

schema_path = "/Users/diptonath/Documents/coding/hire-flow/backend/prisma/schema.prisma"

with open(schema_path, 'r') as f:
    existing = f.read()

if "model Job" in existing:
    print("Models already exist in schema")
    exit(0)

models = []