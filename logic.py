
import operator 
import random 

class Life():
    def __init__(self, name) -> None:
        self.reward = 0 
        self.age = 0
        self.name = name


def reward_logic(life: Life, something):
    result = something

    # Reward & Purnish Logic
    # Here, simply minus number is purnish, plus number is reward
    if result <= 0:
        return -1
    elif result > 0:
        return +1

def do(life: Life, something):
    """ Action function """
    reward = reward_logic(life, something)
    if reward != 0:
        life.reward  += reward 
        print(f"Life's reward memory is modified: get {reward}. Current reward is {life.reward}")
    # print(f"\'{life.name}\' do \'{something}\' and the reward get \'{life.reward}\'")


def expect(life, operator, object1, object2):
    result = reward_logic(life, operator(object1, object2))
    print("Result: ", result)
    if result < 0:
        print(f"Expect: \'{life.name}\' will not do \'{object1}\' {operator.__name__} \'{object2}\' because the reward will be \'{result}\'")
        return -1
    elif result > 0:
        print(f"Expect: \'{life.name}\' will do \'{object1}\' {operator.__name__} \'{object2}\' becuase the reward will be \'{result}\'")
        # do(life, operator(object1, object2))
        return 1 
    elif result == 0:
        return 0 
    else:
        raise ValueError


l1 = Life('l1')

# expect(l1, operator.add, 1, 2)
# expect(l1, operator.add, 3, 2)
# expect(l1, operator.add, 4, 2)
# expect(l1, operator.add, 4, 2)
# expect(l1, operator.add, -4, 2)

print(l1.reward)

life_1 = Life('life_1')

# pick 2 numbers
def get_random_int():
    return random.randint(-100, 100)
memory = []

def logic1():
    if len(memory) == 0:
        pick_2_numbers = (get_random_int(), get_random_int())
    else:
        count = 0
        for i in memory:
            # for x, y in i:
            #     count += 1
            #     if y == 1:
            #         pick_2_numbers = x
            print("i: ", i)
        pass 

    exp = expect(life_1, operator.add, pick_2_numbers[0], pick_2_numbers[1])
    # memory.append([pick_2_numbers, exp])
    if exp > 0:
        print("YES", exp)
    else:
        print("No", exp)


logic1()

for x in range(10):
    logic1()