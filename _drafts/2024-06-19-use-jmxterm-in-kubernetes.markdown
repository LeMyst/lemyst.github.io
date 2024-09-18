---
layout: post
title: "Use JMXterm with Kubernetes"
date: 2024-06-18 21:01:24 +0200
categories: [java, jmxterm]
tags: [java, jmx, kubernetes, monitoring]
---

## Overview

JMX, or Java Management Extensions, is a technology that allows you to monitor and manage Java applications.
JMXterm is a command line tool that allows you to interact with JMX servers.

In this post, I will show you how to use JMXterm with a Java application running in a Kubernetes cluster.

That can be useful if you want to monitor an application or troubleshoot issues in a production environment where jmap
or other JDK tools are not available.

## Create a Pod with JMX enabled

First, we need to create a Pod with JMX enabled. Here is an example of a Pod definition that exposes JMX on port 1099:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: jmx-example
spec:
  containers:
    - name: jmx-example
      image: tomcat
      env:
        - name: POD_IP
          valueFrom:
            fieldRef:
              fieldPath: status.podIP
        - name: JAVA_TOOL_OPTIONS
          value: |-
            -Dcom.sun.management.jmxremote
            -Dcom.sun.management.jmxremote.authenticate=false
            -Dcom.sun.management.jmxremote.ssl=false
            -Dcom.sun.management.jmxremote.local.only=false
            -Dcom.sun.management.jmxremote.port=9012
            -Dcom.sun.management.jmxremote.rmi.port=9012
            -Djava.rmi.server.hostname=$(POD_IP)
```

## Port forward the JMX port

Next, we need to port forwa rd the JMX port to our local machine. You can do this with the following command:

```bash
kubectl port-forward jmx-example 9012:9012
```

## Connect to the JMX server

Now that we have the JMX port forwarded, we can connect to the JMX server using JMXterm. You can download JMXterm from
[here](https://github.com/LeMyst/jmxterm/releases/latest).

Once you have downloaded JMXterm, you can connect to the JMX server with the following command:

```bash
java -jar jmxterm-1.0.6-lemyst-uber.jar -l service:jmx:rmi:///jndi/rmi://localhost:9012/jmxrmi
```
