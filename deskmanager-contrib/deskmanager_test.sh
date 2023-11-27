#!/usr/bin/env bash
src_dir=$(dirname "$0")

supported_commands=("diff" "install" "list-handlers" "list-features" "uninstall")
supported_features=("execfile" "systemd" "config" "pacman")

feature_name="$1"
command="$2"

if [[ -z "$feature_name" || ! ${supported_features[@]} =~ "$feature_name" ]]
then
  echo "feature: [${feature_name}] not supported. Supported features: [${supported_features[@]}]"
  exit 1
fi

if [[ -z "$command" || ! ${supported_commands[@]} =~ "$command" ]]
then
  echo "command: [${command}] not supported. Supported commands: [${supported_commands[@]}]"
  exit 1
fi

deskmanager --feature-dir "$src_dir/example/features" --handler-dir src --feature-name "$feature_name" "$command"
