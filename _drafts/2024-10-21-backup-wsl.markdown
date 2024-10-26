---
title: "Backup WSL to file"
author: myst
date: 2024-10-21 18:00:00 +0200
last_modified_at: 2024-10-21 18:00:00 +0200
categories: [ wsl ]
tags: [ wsl, backup ]
---

If you are using the Windows Subsystem for Linux (WSL), it's possible to backup your WSL installation to a file. This can be useful if you want to create a snapshot of your current WSL setup or if you want to transfer your WSL installation to another machine.

List all installed WSL distributions:

```cmd
wsl --list
```

I will be using the Debian distribution in this example.

Export the WSL distribution to a tar file:

```cmd
wsl --export Debian C:\path\to\backup.tar
```

This command will create a tar file containing the Debian distribution. You can replace `Debian` with the name of your WSL distribution and `C:\path\to\backup.tar` with the path where you want to save the backup file.
