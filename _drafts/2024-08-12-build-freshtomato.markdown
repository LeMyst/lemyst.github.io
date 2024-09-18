---
title: "Build FreshTomato for the Asus RT-AC68U"
author: myst
date: 2024-08-12 12:00:00 +0200
last_modified_at: 2024-08-12 12:00:00 +0200
categories: [ networking ]
tags: [ asus, rt-ac68u, tomato, freshtomato, openwrt, build, compile, firmware, router ]
---

FreshTomato is a fork of the popular Tomato firmware for various routers. It is a Linux-based firmware for wireless routers and access points, primarily those based on Broadcom ARM CPUs. This guide will show you how to build FreshTomato for the Asus RT-AC68U router.

## Prerequisites

- A Linux machine (I used Debian 12.5)
- Basic knowledge of the Linux command line
- Git installed on your machine
- A working internet connection
- A USB drive with at least 4GB of storage
- A supported router (Asus RT-AC68U in this case)

## Step 1: Install the required packages

First, you need to install the required packages to build FreshTomato. Open a terminal and run the following commands:

```terminal
sudo apt update
sudo apt install build-essential git gtk-doc-tools
```

## Step 2: Clone the FreshTomato repository

Next, you need to clone the FreshTomato repository to your machine. Run the following command in the terminal:

```terminal
git clone https://bitbucket.org/pedro311/freshtomato-arm.git
```

## Step 3: Prepare the build environment

Change to the FreshTomato directory and run the following command to prepare the build environment:

```terminal
cd freshtomato-arm
git clean -fdxq
git reset --hard
```


## Step 4: Build FreshTomato for the Asus RT-AC68U

Run the following command to build FreshTomato for the Asus RT-AC68U:

```terminal
cd release/src-rt-6.x.4708
make ac68z
```

## Step 5: Get the firmware image

After the build process is complete, you will find the firmware image in the `release/src-rt-6.x.4708/image` directory.

## Step 6: Flash the firmware

Use the administration interface of your router to flash the firmware image you just built. Make sure to follow the instructions provided by FreshTomato to avoid any issues.

## Conclusion

That's it! You have successfully built FreshTomato for the Asus RT-AC68U router. Enjoy the new features and improvements that FreshTomato has to offer!

## DHCPv6 interface modification

If you want to modify the DHCPv6 interface, you can do so by editing the `release/src-rt-6.x.4708/router/dhcpv6/common.c` file. Make sure to rebuild the firmware after making any changes.

Replace:
```
if ((hwlen = gethwid(tmpbuf, sizeof(tmpbuf), NULL, &hwtype)) < 0) {
```

With:
```
if ((hwlen = gethwid(tmpbuf, sizeof(tmpbuf), "vlan100", &hwtype)) < 0) {
```

This change will modify the DHCPv6 interface to use `vlan100` instead of the default interface.

You can add debug messages with the following code in the interface loop:
```
dprintf(LOG_DEBUG, FNAME, "found an interface %s", ifa->ifa_name);
```