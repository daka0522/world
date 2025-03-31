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

    COLORS: list[_color] = [RED, BLUE, GREEN, ORANGE, PURPLE]

