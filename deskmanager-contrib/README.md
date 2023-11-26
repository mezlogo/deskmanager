# deskmanager contrib

Handlers:
- `execfile`: executes file with command passed as argument, sets cwd and binds stdio
- `config`: links file if needed
- `pacman`: installs packages with pikaur cli
- `systemd`: enables system and user services

Handlers will be executed in following order:
1. (10) pacman
1. (30) config
1. (50) execfile
1. (70) systemd

How to test:
- for systemd test execute:
```sh
sudo ln -s "$(pwd)/example/features/systemd_sample/my-system-wide.service" /etc/systemd/system/my-system-wide.service
ln -s "$(pwd)/example/features/systemd_sample/my-user-wide.service" $HOME/.config/systemd/user/my-user-wide.service
sudo systemctl daemon-reload
```
