#!/bin/sh

if [ $NODE_ENV == "production" ]
then
    exec yarn start 
else
    echo "Running in development mode"
    exec yarn dev
fi
