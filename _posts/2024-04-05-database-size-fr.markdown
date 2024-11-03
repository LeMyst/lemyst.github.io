---
layout: post
title:  "MySQL Database size"
date:   2024-04-05 12:42:34 +0200
categories: [mysql]
tags: [mysql, database, size, query]
lang: fr
---

Cette requête permet de lister les bases de données MySQL et leur taille en octets, mégaoctets et gigaoctets.

This query lists MySQL databases and their size in bytes, megabytes, and gigabytes.

```sql
SELECT
    table_schema AS Database_Name,
    SUM(data_length + index_length) Size_In_Bytes,
    ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) Size_In_MB,
    ROUND(SUM(data_length + index_length) / 1024 / 1024/ 1024, 2) Size_In_GB
FROM information_schema.tables
GROUP BY table_schema ORDER BY Size_In_Bytes DESC;
```