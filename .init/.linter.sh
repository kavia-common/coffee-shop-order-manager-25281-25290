#!/bin/bash
cd /home/kavia/workspace/code-generation/coffee-shop-order-manager-25281-25290/coffee_shop_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

