---
title: "QZone Museum"
date: 2026-06-14
link: ""
site: "https://qzone2000.com"
tags:
  ["Web"]
description: A digital archive + design your own page minigame, preserving 5,851 decorative assets from QZone, Tencent's personal homepage platform. 
heroImage: "/images/projects/qzone.png"
---

The QZone Museum is an unofficial, non-profit digital archive of 5,851 decorative elements for  QZone (QQ空间), created between 2005 and 2009. Assets include skins, pendants, floaties, cursors, title bars and flash music players.

QZone is the personal-homepage platform Tencent launched in 2005. At its peak it had over 600 million monthly active users, making it the largest social network in China at the time. For a generation it was the first page of their own, and what Y2K maximalism and Fei Zhu Liu ("non-mainstream") looked like on the Chinese internet. It was also where I first learned html.

# On internet memory
Adobe ended Flash at the close of 2020 and browsers removed it; QQShow was taken down in 2021; the flower-vine garden stopped operating in 2022; though QZone itself technically still exists, its decoration mall is long gone.

The project started from the Internet Archive Wayback Machine's CDX index, where I found out (with great surprise) that most of the decoration assets still answered at their original addresses, fifteen years later. So I fetched assets straight from their original URLs, then recovered the few dead ones from the Wayback Machine. The item ids, Chinese names, release dates, prices and color tags were all crawled from the QZone decoration mall's catalog API.

The animated cursor .ani files were decoded frame by frame into APNGs, the music players Flash pendants ran in the Ruffle emulator, and the floaties' drifting paths were reconstructed according to Tencent's 2006 front-end code.

The Chinese web moved into closed platforms early and wholesale, and the Wayback Machine cannot crawl content behind an account. The parts of QZone that survived were files like the GIFs, skins, and cursors; meanwhile, the data that lived behind login endpoints — custom layouts, flower gardens, guestbooks — all disappeared along with the servers.

This project is deeply influenced by my friend Kay Zeng's [qqshow2000.com](qqshow2000.com). She rebuilt QQShow from assets salvaged out of the Wayback Machine; her site also lives inside this museum's QZone dress-up page. Like QQShow, QZone shaped how hundreds of millions of people first imagined the internet, yet remains nearly unknown outside the Chinese-speaking web. We hope this history can be seen by the wider world.

Equally formative were Jordan Eldredge's [Webamp](https://webamp.org/), which brought the Windows desktop music player back to life by rewriting it in JavaScript. And thank you to artist friends doing internet digital-archive work, including Yufeng Zhao and Lewei Huang's [BannerDepot 2000](https://banner-depot-2000.net/) and Amad Ansari's [Palestine Online](https://palestineonline.net/).
