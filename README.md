# deskmanager

Install and maintain your own pc desktop by declare isolated collections of functionality.

## motivation

### problem

I have two notebooks with identical environment for several years and it's so cumbersome to reinstall, evolve and syncronize. Especially when it comes to clean up previous solution.

Under `desktop` I assume use case when YOU and only YOU use and own a computer. So you doing both: system-wide configuration (kernel modules and parameters, packages, newtorking, docker and so on) AND user-wide configuration (shell, neovim, vscode, git and e.t.c.)

Under `environment` I assume following things:
- configuration touchpad, mouse and keyboard by coping files to user-restricted `/etc/X11/xorg.conf.d`
- configuration kernel modules, e.g. exluding beeper, by coping files to user-restricted `/etc/modprobe.d`
- configuration kernel settings, e.g. modifing ipV4 ttl, by coping files to user-restricted `/etc/sysctl.d`
- installing system-wide pacages
- enabling systemd services
- enabling systemd user-services
- coping user config in both: $HOME and $XDG_CONFIG_DIRS
- defaul shell, special file permissions, one shot shell execution

### solutions

You may argue, cos' all this stuff was designed to be so easy that I create problem out of nothing. I agree, of cos' literally everything inside your configuration could be describe as following simple steps:
- install packages: `i3 i3blocks alacritty firefox vscode rofi` set of packages just once per installation
- write and place some configuration file under user (~/.config) or system (/etc) dir: just one file `/etc/pacman`
- enable system or user service to start daemon or server: `ly` (login daemon) should be enable just once per system and user service `ssh.daemon` once per user
- add user to some group: `wireshark` user group needs to be set just once per user per group
- execute one-shot program. e.g. `chsh` requries to be executed once per user per shell

I used to save all user-space file just inside git repo with working dir at $HOME, so no special action needed and all other features done by shell script. It works great at the beginning, but someday my environment has grown to something I can handle just by looking at it. In such circumstances I fall in a pit of demotivation: more time I spend to develop better experience more mental energy and time it takes to fresh install, maintain, refactor, syncronize and upgrade.

I realize I need another approach - more modular, atomic and extensible - I wanna create a tool like package manger, which fits only system-wide interaction.

There are lots of tools in automation platform, but all of them (like `ansible` and others) are for orchestration multiple remote machines, not for maintain your local user environment.

I belive that I can write small utility, that would be much powerful, that bash script and much simpler that orchestration tools.

### my solution

The top-noch feature of `deskmanager` over plain bash scripts is declarative configuration - just DECLARE what you wanna get and structure it inside `feature` - package like data.


1. For instance, feature `wireshark` could be declared as follow:

```yml
feature:
  pacman: [wireshark-qt, wireshark-cli, termshark]
  usergroup: [wireshark]
```

You can read it like: 'for me wireshark is set of installed pacman packages AND added group "wireshark" to my user for rootless capturing of traffic'

Even more - you can REMOVE this feature, if it were installed, but time has come and you don't need it anymore. YOU don't need to remeber WHAT packages and groups you installed e.t.c. just uninstall feature 'wireshark' and that's all

Last but not least is calculating diff between declared (desired) state and actual state.

2. Another example of feature `ssh-client`:

```yml
feature:
  pacman: [openssh]
  systemd: [user__ssh-agent.service]
  configs:
    - link: $HOME/.ssh
      target: sshconfig
  execfile: [postconfigs.sh]
```

You can read it like this: for my own ssh-client configuration I need:
- to be installed openssh pacman package
- to be configured user-space ssh setting in `~/.ssh` from my dir `$feature_dir/sshconfig`
- to be executed at least once `postconfig.sh` script
- to be enabled `systemd --user` service called `ssh-agent.service`

For me it just read as it defined in such simple yaml file.

BTW: both order and idempotention is matter here. If you enable service BEFORE it would configured and even installed - you will get an error and vice versa - when it comes to uninstall a reverse oreder is crucial.

Note about idempotention: `script` handler can't calculate whether it should be executed or not, so it's the script's responsibility to make both: only idempotent and fast execution.

In case of `postconfig.sh` there is only changin premissions to keys and .ssh dir, so it both fast and idempotent that's why you should not care about how many times it fired

3. More sophisticated example: `zsh`:

```yml
feature:
  pacman: [zsh, zsh-completions]
  configs:
    - link: $HOME/.zprofile
      target: .zprofile
    - link: $HOME/.config/zsh
      target: zsh
  execfile: [chsh_zsh.sh]
```

Above yml file could be read as follow:
- zsh and zsh-completion should be installed
- ~/.zprofile file should links to `$feature_dir/.zprofile` file
- ~/.config/zsh dir should links to `$feature_dir/zsh` dir
- `$feature_dir/chsh_zsh.sh` should be executed at least once. In our case script calls `chsh` command which is idempotent, doesn't requre root, BUT requries user password even when user default shell is zsh ALREADY.

Example of shell script, expected to be written for ideal usage with `deskmanager` tool. Scipts tests whether default shell is zsh and if so - doesn't call `chsh`. It makes this script: to be idempotent (calling more than one times does not affect system), automative (minimum user interaction) and fast.

```bash
#!/usr/bin/env bash

current_shell="$(getent passwd $USER | awk -F ':' '{print $7}')"
target_shell=/usr/bin/zsh
if [ "$target_shell" != "$current_shell" ]; then
    echo "Your current shell is: $current_shell"
    echo "Try to change it to: $target_shell"
    chsh $USER -s "$target_shell"
fi
```

## architecture

1. `deskmanager` is a heart of the tool. It parses command line options, finds feature files, parses yaml format, builds set of feature declaration and loading feature handlers
2. `deskmanager-contrib` is an necessarily extension for core. Feature handler does all real work: execute programms and traverse file system
3. `yourowndesktop` is a git repo for your own desktop configuration. You'll execute `deskmanager` against it

## modules

- `deskmanager-cli` (executable) is a module for command line usage. It has a `bin` field in `package.json` and could be installed by `npm install -g`.
- `deskmanager-contrib` (plain) is a module with tested extentions - hadnlers.
- `deskmanager-core` (lib) is a heart of the project. It uses common module and can load external module, like contrib module.
- `deskmanager-common` (lib) is a common plain node js module to be used by both core and contrib modules.

## installation

Currently installation from sources is the only way

1. exec `npm install` in each modules or just exec `prepare.sh` script
2. install globally `deskmanager-cli` module
3. assure that npm global bin dir in path. My preference is to install npm global as user-global by setting prefix for npm local repo `prefix=~/.local/npm` and adding bin folder to PATH env: `export PATH="$HOME/.local/npm/bin/:$PATH"`

## usage

- `list-handlers`: `deskmanager --handler-dir deskmanager-contrib/src list-handlers`
- `list-features`: `deskmanager --feature-dir deskmanager-contrib/example/features list-features`
- `install`, `diff`, `uninstall`

# TODO

- [x] write installation section
- [x] support both types of feature declaration: Object notation and Array notation
- [x] create an example of Array declaration
- [x] support field `order` for cases when you wanna overwrite execution order for specific feature declaration
- [x] create an example with `order` field
- [x] create systemd-handler.js
- [x] create sample for systemd system
- [x] create sample for systemd user
- [x] create execfile-handler.js
- [x] create sample for execfile
- [x] create an integration test for handlers infrastructure
- [x] fix bug: serial promise execution of handlers
- [x] add debug messages WITH perfomance metrics
- [x] implement `uninstall` command
- [x] write usage section
- [x] create sample for execfile with different cases for each command: diff, install, uninstall
- [] write autocompletion script
- [x] add profile option support
