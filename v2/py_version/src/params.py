import numpy as np

type _color =  np.ndarray[tuple[int, int, int], np.dtype]

class Color:
    WHITE: _color = np.array([255, 255, 255])
    YELLOW: _color = np.array([255, 255, 0])
    RED: _color = np.array([255, 0, 0])
    BLUE: _color = np.array([0, 0, 255])
    GREEN: _color = np.array([0, 255, 0])
    BLACK: _color = np.array([0, 0, 0])
    ORANGE: _color = np.array([255, 128, 0])
    PURPLE: _color = np.array([128,0,128])

    COLORS: list[_color] = [WHITE, YELLOW, RED, BLUE, GREEN, ORANGE, PURPLE]

def getRandomColor() -> _color:
    color = np.array([np.random.randint(0, 255), np.random.randint(0, 255), np.random.randint(0, 255)])
    return color

def color_add(c1: _color, c2: _color) -> _color:
    r = (c1[0] + c2[0]) / 2
    g = (c1[1]+ c2[1]) / 2
    b = (c1[2] + c2[2]) / 2
    return np.array([r, g, b])
