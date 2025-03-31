import numpy as np 

class Env:
    def __init__(self):
        self.WIDTH: int = 4
        self.HEIGHT: int = 4
        self.reward_map: np.ndarray = np.ones((self.HEIGHT, self.WIDTH), dtype=int)
        self.reward_map[0, 3] = 10 #reward
        self.reward_map[3, 3] = -10 #punish
    
    def next_step(self, state: tuple[int, int]) -> int:
        if 0 <= state[0] < 4 and 0 <= state[1] < 4:
            reward: int = self.reward_map[state]
        else:
            reward: int = -1
        return reward 

class Agent:
    def __init__(self, env: Env):
        self.state: np.ndarray[int, int] = np.array((3, 0)) # initial location, current location
        self.actions: list[int] = [1, 2, 3, 4] # up, right, down, left
        self.reward: int = 0        
        self.memory: np.ndarray = np.zeros((env.HEIGHT, env.WIDTH, len(self.actions)), dtype=int)

    def expect(self, state: tuple[int, int]):
        history_of_state: np.ndarray[int] = self.memory[state[0], state[1]]
        return history_of_state
    
    def best_action(self, history_of_state, epsilon=0.1):
        # epsilon: random explore
        if np.random.randn() < epsilon:
            arg = np.random.randint(0, 4)
        else:
            arg = np.argmax(history_of_state)
        action = self.actions[arg]

        return action


    def state_transition(self, action):
        if action == 1:
            new_state = self.state + np.array([-1, 0])
        elif action == 2:
            new_state = self.state + np.array([0, 1])
        elif action == 3:
            new_state = self.state + np.array([1, 0])
        elif action == 4:
            new_state = self.state + np.array([0, -1])
        else:
            raise Exception("Unvalid action")
        return new_state

    def move_to_state(self, new_state):
        if 0 <= new_state[0] < 4 and 0 <= new_state[1] < 4:
            return new_state 
        else:
            return self.state

