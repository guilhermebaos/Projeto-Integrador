with open("colormap.csv", "r") as file:
    text = file.read().split("\n")


print("[", end="")
for item in text[:-1]:
    print(f"[{item}], ", end="")
print("]")