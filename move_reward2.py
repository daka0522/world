import time
import random

t = time.localtime()
t_format = time.time()
print(f"Day: {t.tm_mday}, Hour: {t.tm_hour}, Minute: {t.tm_min}, Second: {t.tm_sec}")


class Object():
    def __init__(self, name) -> None:
        self.name = name
        self.memory = []
        self.memory_limit = 1000
        self.memory_count = 0
        self.x = 0
        self.y = 500
        self.reward = 0
        self.total_reward = 0

    def move(self, y):
        # append => save from back 
        x = 0
        self.y += y
        self.reward_logic(y)
        self.memory_count += 1
        # 0. Name, 1. Time, 2. Moving (x, y), 3. Position (x, y), 4.Reward at the time, 5. Accumulated Reward
        if len(self.memory) >= self.memory_limit:
            self.memory.pop(0)
        self.memory.append([self.name, self.memory_count, (x, y), (self.x, self.y), self.reward, self.total_reward])
        

    def reward_logic(self, n):
        self.reward = 0
        if n >= 0:
            self.reward -= 1
            self.total_reward -= 1
        else: 
            self.reward += 1
            self.total_reward += 1

    def move_logic(self):
        reward_history = list(filter(lambda x: x[4] == 1, self.memory))
        # 1, 2
        # if len(reward_history) >= 2:
            
        return reward_history
        # reward_path = []
        # for e in self.memory:
        #     count = 0
        #     if e[4] == 1:
        #         reward_path.append(e)
        #         count += 1

a = Object('a')
r = random.choice([-1, 0, 1])
a.move(r)
print(a.memory)

r = random.choice([-1, 0, 1])
a.move(r)
print(a.memory)

r = random.choice([-1, 0, 1])
a.move(r)
print(a.memory)

r = random.choice([-1, 0, 1])
a.move(r)
print(a.memory)

r = random.choice([-1, 0, 1])
a.move(r)
print(a.memory)

re = a.move_logic()
print("RE: ", re)