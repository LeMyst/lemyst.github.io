---
layout: post
title: "Use JMXterm with Kubernetes"
date: 2024-06-18 21:01:24 +0200
categories: [java, jmxterm]
tags: [java, jmxterm, kubernetes]
---

# Overview

JMX, or Java Management Extensions, is a technology that allows you to monitor and manage Java applications.
JMXterm is a command line tool that allows you to interact with JMX servers.

In this post, I will show you how to use JMXterm with a Java application running in a Kubernetes cluster.

That can be useful if you want to monitor an application or troubleshoot issues in a production environment where jmap
or other JDK tools are not available.

# Create a Pod with JMX enabled

First, we need to create a Pod with JMX enabled. Here is an example of a Pod definition that exposes JMX on port 1099:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: jmx-example
spec:
    containers:
    - name: jmx-example
      image: openjdk:17-jre
      env:
      - name: JAVA_TOOL_OPTIONS
        value: -Dcom.sun.management.jmxremote.port=1099 -Dcom.sun.management.jmxremote.authenticate=false -Dcom.sun.management.jmxremote.ssl=false

```