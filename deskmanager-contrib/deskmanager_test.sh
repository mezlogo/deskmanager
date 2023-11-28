#!/usr/bin/env bash
src_dir=$(dirname "$0")

supported_commands=("diff" "install" "list-handlers" "list-features" "uninstall")
supported_features=("execfile" "systemd" "config" "pacman" "array-with-order" "profile")

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

if [ "$feature_name" = "profile" ]; then
  "$src_dir"/../deskmanager-cli/bin/deskmanager.js --feature-dir "$src_dir/example/features" --handler-dir src --profile-name "testprofile.txt" "$command"
else
  "$src_dir"/../deskmanager-cli/bin/deskmanager.js --feature-dir "$src_dir/example/features" --handler-dir src --feature-name "$feature_name" "$command"
  # deskmanager --feature-dir "$src_dir/example/features" --handler-dir src --feature-name "$feature_name" "$command"
fi
