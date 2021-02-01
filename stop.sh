#!/bin/bash
kill -s TERM `pgrep -f npm`
kill -s TERM `pgrep -f node`
