path = "main.py"
content = open(path, "r", encoding="utf-8").read()

old = "app.include_router(course_router.cert_router, prefix=API_V1_PREFIX)"
new = (
    "app.include_router(course_router.cert_router, prefix=API_V1_PREFIX)\n"
    "app.include_router(course_router.comment_router, prefix=API_V1_PREFIX)  # 2.5"
)

if old in content and "comment_router" not in content:
    content = content.replace(old, new, 1)
    open(path, "w", encoding="utf-8").write(content)
    print("[OK] comment_router added")
elif "comment_router" in content:
    print("[OK] already present")
else:
    print("[WARN] not found")
    print(repr(content[content.find("cert_router")-5:content.find("cert_router")+80]))
