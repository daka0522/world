import pygame
import random
import numpy as np

# world space setting
WIDTH = 500
HEIGHT = 500
TILE = 10
TILESIZE = HEIGHT//TILE

# display
DISPLAY_WIDTH = WIDTH + 300

#set up the colors
WHITE = (255, 255, 255)
YELLOW = (255, 255, 0)
RED   = (255,   0,   0)
BLUE = (0, 0, 255)
GREEN = (0, 255, 0)
BLACK = (  0,   0,   0)
ORANGE = (255, 128, 0)
PURPLE = (128,0,128)

# COLOR_LOGIC = [WHITE, YELLOW, RED, BLUE, GREEN, ORANGE]


# pygame setup
pygame.init()
screen = pygame.display.set_mode((DISPLAY_WIDTH, HEIGHT))
clock = pygame.time.Clock()
running = True


class World():
    """
    World class is like Universe, Nature in real world.
    It has spaces and memories of lifes, its occupied space, and death of lifes.
    First of all this program, World must be created before any lifes, such as a cell in this program.
    When World instance is created, it creates spaces and its logic of life. 
    In this program, a space is 2D map.
    """
    def __init__(self) -> None:
        self.space = [(x, y) for x in range(TILESIZE, WIDTH, TILESIZE) for y in range(TILESIZE, HEIGHT, TILESIZE)]
        self.occupied = []
        self.grid = np.ones((TILE, TILE), dtype=bool)  # NumPy array: True = free, False = occupied

        self.born = 0
        self.lifes = []
        self.death = 0

WORLD = World()

def color_add(c1, c2):
    r = (c1[0] + c2[0]) // 2
    g = (c1[1]+ c2[1]) // 2
    b = (c1[2] + c2[2]) // 2
    return pygame.Color(r, g, b)


class Cell():
    """
    Cell is primary life in this program.
    When it is created, it declare its existence to the World.
    So to World life is added by creating it.
    It has some features of itself, such as name, color, age, position. 
    This features is used to recognize itself, so to speak, it can be called 'Ego' of Human.
    
    There's 2 primary logic of life.
    1. Survive
    2. Reproduction

    1. Survive
     Survive is implemented into a function of moving at an abstract level.
    'It moves therefore it is alive.'

    2. Reproduction
     Reproduction is implemented at the range of certain ages.

    3. Communication (Interaction)
     It has function of interaction with another life.
    In this program it is implemented into changing its color.
    """

    def __init__(self, name: str, color: tuple[int, int, int] = None) -> None:
        self.name = name
        self.age = 0
        self.alive = True
        self.position = self.occupy()
        if color == None:
            self.color = random.choice([WHITE, YELLOW, RED, BLUE])
        else:
            self.color = color
        self.color_changed = 0

        WORLD.lifes.append(self)
        WORLD.born += 1

        # print("Born: ", self.name, "Position: ", self.position)
        # print("Occupied: ",self.name,  WORLD.occupied)

    def occupy(self):
        if len(WORLD.space) > 0: 
            get_space = random.choice(WORLD.space)
            WORLD.occupied.append(get_space)
            WORLD.space.remove(get_space)
            return get_space
        else:
            self.death()

    def get_circumstance(self): 
        return [(self.position[0] - TILESIZE, self.position[1] - TILESIZE), (self.position[0], self.position[1] -TILESIZE), (self.position[0] + TILESIZE, self.position[1] - TILESIZE),
                (self.position[0] - TILESIZE, self.position[1]), (self.position[0], self.position[1]), (self.position[0] + TILESIZE, self.position[1]),
                (self.position[0] - TILESIZE, self.position[1] + TILESIZE), (self.position[0], self.position[1] + TILESIZE), (self.position[0] + TILESIZE, self.position[1] + TILESIZE)]
    
    def move(self):
        if self.alive:
            # If there's free space around it, then it can move to there.
            m = [x for x in self.get_circumstance() if x in WORLD.space]
            if m:
                # free the space
                WORLD.space.append(self.position)
                WORLD.occupied.remove(self.position)

                # reset the position to the world
                self.position = random.choice(m)
                WORLD.occupied.append(self.position)
                WORLD.space.remove(self.position)

            self.age += 1
            print("Name: ", self.name, " Age: ", self.age, " Position: ", self.position)

            self.cognize()
            rect = pygame.Rect(self.position[0] - (TILESIZE//2), self.position[1] - (TILESIZE//2), TILESIZE, TILESIZE)
            pygame.draw.rect(screen, self.color, rect, TILESIZE//2, 0)

        if 20 < self.age < 25:
            self.reproduction()

        if self.age > 70:
            self.death()

    def reproduction(self):
        if len(WORLD.lifes) < ((TILE-1)*(TILE-2)):
            if len(WORLD.space) > 0:
                Cell('C' + str(WORLD.born))

    def death(self):
        self.alive = False
        WORLD.death += 1
        WORLD.lifes.remove(self)
        # free the space
        if self.position != False:
            WORLD.space.append(self.position)
            WORLD.occupied.remove(self.position)
    
    
    def cognize(self):
        # get information of the circumstance (8 positions of self)
        circumstance = self.get_circumstance()

        # ask it's occupied
        occupied = [x for x in circumstance if x in WORLD.occupied]

        # list lifes in WORLD
        lifes = [x for x in WORLD.lifes if x.position in occupied]

        # color logic
        # for x in lifes:           
        #     if (self.color == YELLOW and x.color == RED) or (self.color == RED and x.color == YELLOW):
        #         self.color = ORANGE
        #         print("Color: Orange")

        #     elif (self.color == YELLOW and x.color == BLUE) or (self.color == BLUE and x.color == YELLOW):
        #         self.color = GREEN
        #     elif (self.color == BLUE and x.color == RED) or (self.color == RED and x.color == BLUE):
        #         self.color = PURPLE
        
        # color logic 2
        if self.color_changed <= 3:
            for x in lifes:
                new_color = color_add(self.color, x.color)
                # print(self.name, "'s color: ", self.color, "changed: ", new_color)
                self.color = new_color
                self.color_changed += 1
        return 



def draw_grid():
    grid_color = BLACK
	#0부터 TILESIZE씩 건너뛰면서 WIDTH까지 라인을 그려준다
    for x in range(0, WIDTH, TILESIZE):
    	#첫번째 인자부터 game_world(게임 화면)에 (0,0,0,50)의 색으로 차례대로 라인을 그려준다
        pygame.draw.line(screen, grid_color, (x, 0), (x, HEIGHT))
    for y in range(0, HEIGHT, TILESIZE):
        pygame.draw.line(screen, grid_color, (0, y), (WIDTH, y))
        

# Font
myFont = pygame.font.SysFont( "arial", 20)
text_Title= myFont.render(str(len(WORLD.lifes)), True, WHITE)

# Initiate
c0 = Cell("c0", ORANGE)
c1 = Cell("c1")
c2 = Cell("c2")

while running:
    # poll for events
    # pygame.QUIT event means the user clicked X to close your window
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False

    # fill the screen with a color to wipe away anything from last frame
    screen.fill("black")

    # RENDER YOUR GAME HERE
    draw_grid()

    # print("Lifes: ", WORLD.lifes)
    for x in WORLD.lifes:
        x.move()

    # Display program info.

    lifes = myFont.render("Lifes: " + str(len(WORLD.lifes)), True, WHITE)
    space = myFont.render("Space: " + str(len(WORLD.space)), True, WHITE)
    occupied = myFont.render("Occupied: " + str(len(WORLD.occupied)), True, WHITE)
    total_space = myFont.render("Total Space: " + str(len(WORLD.space + WORLD.occupied)), True, WHITE)
    born = myFont.render("Born: " + str(WORLD.born), True, WHITE)
    death = myFont.render("Death: " + str(WORLD.death), True, WHITE)

    screen.blit(lifes, [WIDTH+50, 50])
    screen.blit(space, [WIDTH+50, 100])
    screen.blit(occupied, [WIDTH+50, 150])
    screen.blit(total_space, [WIDTH+50, 200])
    screen.blit(born, [WIDTH+50, 250])
    screen.blit(death, [WIDTH+50, 300])

    # flip() the display to put your work on screen
    pygame.display.update()

    clock.tick(20)  # limits FPS to 60

pygame.quit()