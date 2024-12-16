---
title: "Kubernetes Cheat Sheet"
author: myst
date: 2024-12-12 11:35:00 +0100
categories: [ kubernetes ]
tags: [ kubernetes, cheat-sheet ]
lang: en
---

## Kubernetes Cheat Sheet

### Show enabled feature gates

```bash
kubectl get --raw /metrics | grep kubernetes_feature_enabled
```