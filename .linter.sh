#!/bin/bash
cd /home/kavia/workspace/code-generation/classicminesweeper-61587-c69c9f54/classicmine_sweeper
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

