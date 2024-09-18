---
title: "Build NGINX with RTMP module"
author: myst
date: 2024-08-12 13:00:00 +0200
last_modified_at: 2024-08-12 13:00:00 +0200
categories: [ nginx ]
tags: [ nginx, rtmp, build, compile, streaming, video ]
---

NGINX is a popular web server that can also be used as a reverse proxy, load balancer, and media streaming server. The RTMP module is a free (BSD license) module for NGINX that adds RTMP media streaming capabilities.

In this guide, I will show you how to build NGINX with the RTMP module from source on a Linux machine.

## Prerequisites

- A Linux machine (I used Debian 12.5)
- Basic knowledge of the Linux command line
- Git installed on your machine
- A working internet connection
- Build tools (gcc, make, etc.)

## Step 1: Install the required packages

First, you need to install the required packages to build NGINX. Open a terminal and run the following commands:

```bash
sudo apt update
sudo apt install build-essential git dpkg-dev software-properties-common python-software-properties init-system-helpers
```

## Step 2: Clone the NGINX source repository

Next, you need to clone the NGINX source repository to your machine. Run the following command in the terminal:

```bash
git clone https://github.com/arut/nginx-rtmp-module.git
apt-get source nginx
```

## Step 3: Prepare the build environment

Change to the NGINX source directory and run the following command to prepare the build environment:

```bash
cd nginx
./configure --with-http_ssl_module --add-module=../nginx-rtmp-module
make install
```

## Step 4: NGINX configuration

Now that NGINX is built with the RTMP module, you can configure NGINX to stream media content. Here is an example NGINX configuration file that sets up an RTMP server:

```nginx
#user  nobody;
worker_processes  1;

#error_log  logs/error.log;
#error_log  logs/error.log  notice;
#error_log  logs/error.log  info;

#pid        logs/nginx.pid;


events {
    worker_connections  1024;
}


http {
    include       mime.types;
    default_type  application/octet-stream;

    #log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
    #                  '$status $body_bytes_sent "$http_referer" '
    #                  '"$http_user_agent" "$http_x_forwarded_for"';

    #access_log  logs/access.log  main;

    sendfile        on;
    #tcp_nopush     on;

    #keepalive_timeout  0;
    keepalive_timeout  65;

    #gzip  on;

    server {
        listen       80;
        server_name  localhost;

        #charset koi8-r;

        #access_log  logs/host.access.log  main;

        location / {
            root   html;
            index  index.html index.htm;
        }

        #error_page  404              /404.html;

        # redirect server error pages to the static page /50x.html
        #
        error_page   500 502 503 504  /50x.html;
        location = /50x.html {
            root   html;
        }

        # proxy the PHP scripts to Apache listening on 127.0.0.1:80
        #
        #location ~ \.php$ {
        #    proxy_pass   http://127.0.0.1;
        #}

        # pass the PHP scripts to FastCGI server listening on 127.0.0.1:9000
        #
        #location ~ \.php$ {
        #    root           html;
        #    fastcgi_pass   127.0.0.1:9000;
        #    fastcgi_index  index.php;
        #    fastcgi_param  SCRIPT_FILENAME  /scripts$fastcgi_script_name;
        #    include        fastcgi_params;
        #}

        # deny access to .htaccess files, if Apache's document root
        # concurs with nginx's one
        #
        #location ~ /\.ht {
        #    deny  all;
        #}
    }


    # another virtual host using mix of IP-, name-, and port-based configuration
    #
    #server {
    #    listen       8000;
    #    listen       somename:8080;
    #    server_name  somename  alias  another.alias;

    #    location / {
    #        root   html;
    #        index  index.html index.htm;
    #    }
    #}


    # HTTPS server
    #
    #server {
    #    listen       443 ssl;
    #    server_name  localhost;

    #    ssl_certificate      cert.pem;
    #    ssl_certificate_key  cert.key;

    #    ssl_session_cache    shared:SSL:1m;
    #    ssl_session_timeout  5m;

    #    ssl_ciphers  HIGH:!aNULL:!MD5;
    #    ssl_prefer_server_ciphers  on;

    #    location / {
    #        root   html;
    #        index  index.html index.htm;
    #    }
    #}

    server {

        listen      8080;

        # This URL provides RTMP statistics in XML
        location /stat {
            rtmp_stat all;

            # Use this stylesheet to view XML as web page
            # in browser
            rtmp_stat_stylesheet /stat.xsl;
        }

        location /stat.xsl {
            # XML stylesheet to view RTMP stats.
            # Copy stat.xsl wherever you want
            # and put the full directory path here
            alias /tmp/stat.xsl;
        }

        location /hls {
            # Serve HLS fragments
            types {
                application/vnd.apple.mpegurl m3u8;
                video/mp2t ts;
            }
            alias /tmp/hls;
            add_header Cache-Control no-cache;
        }

        location /dash {
            # Serve DASH fragments
            root /tmp/hls;
            add_header Cache-Control no-cache;
        }
    }
}

rtmp_auto_push on;

rtmp {
    server {
        listen 1935;

        access_log logs/rtmp_access.log;

        application mytv {
            live on;

            # Turn on HLS
            hls on;
            hls_path /tmp/hls/;
            hls_fragment 3;
            hls_playlist_length 5;


            # disable consuming the stream from nginx as rtmp
            deny play all;
        }
    }
}
```