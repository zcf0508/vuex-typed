#!/bin/bash

echo '*** test on vue 2 + vuex 3 ***'
pnpm install
pnpm run build
pnpm run test:once
pnpm typecheck

echo '*** test on vue 3 + vuex 4 ***'
mv package.json package3.json
mv package4.json package.json
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
pnpm run build
pnpm run test:once
pnpm typecheck

echo '*** switch back vue 2 + vuex 3 ***'
mv package.json package4.json
mv package3.json package.json
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install