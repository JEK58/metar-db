#!/bin/sh

if [ $NODE_ENV == "production" ]
then
    echo "Running in production mode"
    exec yarn install && yarn start
else
    echo "Running in development mode"
    exec yarn dev
fi
