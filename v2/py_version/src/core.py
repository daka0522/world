import numpy as np 
import time 
from collections import defaultdict
from params import Color, _color, getRandomColor, color_add
from typing import Any

""" 
=====================================================================================
Logic 
1. World is created with spaces.
2. Cell is created with world.
3. Cell is born in the world.
4. Cell dies in the world.
5. Cell can be born in the world.
"""

type _location = None | np.ndarray[tuple[int, int], np.dtype[np.signedinteger]] | tuple[int, int]
type _face = int | None | np.ndarray


class World: 

    type _state = int | str 
    """
    World is where all the object lives and dies.
    It gives spaces and some other informations.
    You can set the size of the world.
    """
    def __init__(self, size: int=10) -> None:
        self.HEIGHT = size 
        self.WIDTH = size

        """
        spaces:  World map, coordination
            0       1       2       3   ...
        0 (0,0) | (0,1) | (0,2) | (0,3)
        1 (1,0) | (1,1) | (1,2) | (1,3)
        2 (2,0) | (2,1) | (2,2) | (2,3)
        3 (3,0) | (3,1) | (3,2) | (3,3)
        ...
        """
        self.spaces: np.ndarray[tuple[int, int], np.dtype[Any]] = np.zeros((self.HEIGHT, self.WIDTH), dtype=object)


        self.matter: dict[str, list[Matter | Cell | Food]] = defaultdict(list)
        self.matter_count: dict[str, int] = defaultdict(int)

        self.states = ["Cell", 0, "Food", -1]
        self.state_reward_map: dict = {"Cell": -1, 0: 1, "Food": 10, -1: -1}


    def getFreeLocation(self) -> np.ndarray[_location, np.dtype[np.int_]]:
        """Search a free space and give it back."""
        return np.stack(np.where(self.spaces == 0), axis=1)



class Matter:
    """
    Proto type of life.
    Sub classes: Cell, Food
    """
    def __init__(self, world: World, location: _location=None) -> None:
        self.world: World = world
        self.is_alive: bool = False 
        self.current_location: _location 
        self.color: _color = Color.BLACK
        self.age: int = 0 
        self.born_time: float = 0.0
        self.name: str = '' 
        self.class_name: str = self.__class__.__qualname__

        # Set location or get random location
        if location is None:
            location = self.getRandomLocation()
        else: 
            location = location
        self.born(location)

    def getRandomLocation(self) -> _location | None:
        freeLocations = self.world.getFreeLocation()
        len_location = len(freeLocations)
        if len_location == 0:
            return None
        else:
            location = np.random.choice(len_location)
            return freeLocations[location]

        
    def born(self, location: _location) -> None:
        if location is None:
            raise Exception("No free location")
        else:
            self.world.spaces[location[0], location[1]] = self 
            self.current_location = location

            self.world.matter[self.class_name].append(self) # for examples: 'Cell': [instacnes..]
            self.world.matter_count[self.class_name] += 1

            self.is_alive = True
            self.born_time = time.time()
            self.name = f"{self.class_name}_{self.world.matter_count[self.class_name]}"
            # self.color = Color.COLORS[np.random.choice(len(Color.COLORS))] 
            self.color = getRandomColor()
    
    def die(self) -> None: 
        if self.is_alive and self.current_location is not None: 
            row, col = self.current_location
            if self.world.spaces[row, col] == self:
                self.world.spaces[row, col] = 0
            
            self.is_alive = False
            self.color = Color.BLACK 
            self.current_location = None 

            if self in self.world.matter[self.class_name]:
                self.world.matter[self.class_name].remove(self)
        else:
            print(f"{self.name} is already dead")

    def __repr__(self):
        if self.is_alive:
            return f"{self.name}" 
        else: 
            return f"Unborn {self.class_name}"


class Food(Matter):
    """
    food for cell
    1. location
    2. state {is_alive, dead}
    """
    def __init__(self, world: World):
        super().__init__(world)
        self.energy: int = 20

type _state = int

class Cell(Matter): 
    
    """ 
    Cell is a living one. it's born with name, age, color, face(direction).
    1. born: born with a given world
    2. die: die itself
    3. move: move somewhere
    4. eat
    """
    def __init__(self, world: World, location: _location = None) -> None:
        # Only for cell(mover).
        self.face: _face = 1  # clock wise: front=0 -> right=1 -> back=2 -> left=3
        self.energy = 50
        self.MAX_ENERGY = 100

        super().__init__(world, location)

        # States: {0: Empty, 1: Other Cell, 2: Food, 3: Wall(out boundary)}
        self.states: list[_state]= [0, 1, 2, 3]
        # Actions: {1. turn face, 2. move}
        self.actions = ["turn_face", "go"]
        
        # Memory
        self.memory = np.zeros((len(self.states), len(self.actions)), dtype=int) # [(state, reward of action)..]

    def born(self, location) -> None:
        super().born(location)
        self.face = np.random.choice([0, 1, 2, 3])   

    def sense_front(self, sense_reach: int = 1) ->  _location | None:
        """
        Try to move with face(direction), get new location to move.
        There's some rules. It cant' move beyond the world map. So, the widht and height of the world.
        Secondly, it should have a logic to bump with other cells.
        
        Parameters
        ----------

        sense_reach: how far to sense (window size)
        """
        if self.face == 0:  # front
            new_location = self.current_location + np.array([-sense_reach, 0])
        elif self.face == 1:    # right
            new_location = self.current_location + np.array([0, sense_reach])
        elif self.face == 2:    # back
            new_location = self.current_location + np.array([sense_reach, 0])
        elif self.face == 3:    # left
            new_location = self.current_location + np.array([0, -sense_reach]) 
        else:
            raise Exception("Unknown face value. It must be {0, 1, 2, 3}")
        return new_location
        
    def ask_next_move(self) -> None:
        """ 
        1. Cell sends a location of next move to World.
        2. World respond to the cell, what's in the location it asked.
        """
        new_location = self.sense_front()

        if new_location is not None:
            inside_world = 0 <= new_location[0] < self.world.HEIGHT and 0 <= new_location[1] < self.world.WIDTH
            
            if inside_world:
                whats_next = self.world.spaces[new_location[0], new_location[1]] 
                # If it's empty then go. 0 means empty, so free to move
                if whats_next == 0: 
                    self.move(new_location)
                # If it's a food then eat it.
                elif isinstance(whats_next, Food):
                    self.eat(whats_next)
                else:
                    self.turn_face()
            else:
                self.turn_face()

    # RL Function 1
    def ask_whats_next(self, new_location: _location) -> World._state | np.ndarray | None:
        if new_location is not None:
            inside_world = 0 <= new_location[0] < self.world.HEIGHT and 0 <= new_location[1] < self.world.WIDTH
            if inside_world:
                obj =  self.world.spaces[new_location[0], new_location[1]] 
                if obj == 0:
                    return self.states[0]
                elif type(obj) == Cell:
                    return self.states[1]
                elif type(obj) == Food:
                    return self.states[2]
            else:
                return self.states[3] # outside world means wall(block) = 3
        else: 
            return None

    # RL Function 2
    def expect(self, next_state):
        history_of_state = self.memory[next_state]
        return history_of_state

    # RL Function 3
    def best_action(self, history_of_state: np.ndarray[tuple[int, int], np.dtype], epsilon=0.1):
        # if there's no memory at all, so sum of memory == 0:
        if np.sum(history_of_state) == 0:
            return 1 # go
        else:
            if np.random.randn() < epsilon:
                return np.random.choice(len(self.actions))
            else:
                return np.argmax(history_of_state)
    
    # RL Function 4
    def do_action(self, action, next_state, new_location, enable_color_add=False):
        action = self.actions[action]
        if action == "turn_face":
            self.turn_face()
            reward =  0
        elif action == "go":
            reward = self._go(next_state, new_location, enable_color_add) 
        else:
            raise Exception("Invalid action")
        return reward
    
    # RL Function 5
    def remember(self, next_state, action, reward):
        self.memory[next_state][action] += reward
         
    # RL Function - private
    def _go(self, next_state: _state, new_location, enable_color_add=False):

        if next_state == 0: # empty
            self.move(new_location)
            result =  1
        elif next_state == 1: # otehr cell
            self.turn_face()
            # if meet other cell, then color add with others, and divide by 2.
            what = self.world.spaces[new_location[0], new_location[1]]
            if enable_color_add and isinstance(what, Cell):
                self.color = color_add(self.color, what.color)
            result = -1 
        elif next_state == 2: # food 
            what = self.world.spaces[new_location[0], new_location[1]]
            if isinstance(what, Food):
                self.eat(what)
            result = 1
        # If new_location is out of world, then give negative reward, and not change the location:
        elif next_state == 3: # wall
            self.turn_face()
            result = -1
        else:
            raise Exception("Unknown next state")
        return result
        

   
    def do_rl(self):
        new_location = self.sense_front()
        next_state = self.ask_whats_next(new_location)
        self.expect(next_state)

    # Action 1
    def move(self, new_location) -> None:
        # Clear old location
        if self.current_location is not None:
            row, col = self.current_location 
            if self.world.spaces[row, col] == self:
                self.world.spaces[row, col ] = 0
        
        # Update world spaces info
        self.current_location = new_location
        self.world.spaces[new_location[0], new_location[1]] = self

        # consumtion and aging option: age +1 per a move.
        # self.age += 1
        self.energy -= 1
    
    # Action 2
    def turn_face(self, new_face: _face = None) -> None:
        # random choice
        if new_face is None:
            new_face = np.where(self.face != [0, 1, 2, 3])[0] # except its previous face
        self.face = np.random.choice(new_face)

    def eat(self, food: Food) -> None:
        # self.energy += food.energy
        food.die()

    # Aging system
    def aging(self) -> None:
        current_time = time.time()
        elapsed_time = np.round(current_time - self.born_time, 2)

        if self.is_alive and elapsed_time % 5:
            self.age += 1 
            self.color = self.color * 0.975

            if self.age > 100:
                self.die()
    