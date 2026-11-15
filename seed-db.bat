@echo off
title Seed Database
cd backend
echo Seeding initial demo data to MongoDB...
npm run seed
pause

