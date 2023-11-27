#!/usr/bin/env bash

command="$1"

case "$1" in
  diff)
    echo "cwd is: [$(pwd)] and dir content is: [$(ls)]"
    ;;

  install)
    printf "Enter text ot echo: "
    read text_to_echo
    echo "echo: [$text_to_echo]"
    ;;

  uninstall)
    echo "you execute unistall command"
    ;;

  *)
    echo "given command: [$command] is unsupported"
    ;;
esac
