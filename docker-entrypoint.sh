#!/bin/sh
yarn install

if [ $NODE_ENV == "production" ]
then
    exec install 
    exec yarn start 
else
    echo "Running in development mode"
    exec yarn dev
fi
