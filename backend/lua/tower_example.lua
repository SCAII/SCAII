function sky_reset(rng)
    local agent = {
        pos = {x=200.0, y=200.0},
        unit_type="agent",
        faction=0,
    }

    local towers = {
        [1] = { 
            unit_type="small_tower",
            faction=0 
        },
        [2] = { 
            unit_type="big_tower",
            faction=0
        },
        [3] = {
            unit_type="small_tower",
            faction=1
        },
        [4] = {
            unit_type="big_tower",
            faction=1,
        }
    }

    out = {}
    table.insert(out, agent)

    for i = #towers,1,-1 do
        next_tower = rng:rand_int(1,i+1)
        tower = table.remove(towers, next_tower)


        x_max = (( (i-1) // 2) + 1) * 200.0 - 50.0
        
        y_max = (( (i-1) %  2) + 1) * 200.0 - 50.0

        x = rng:rand_double(x_max - 100.0, x_max)
        y = rng:rand_double(y_max - 100.0, y_max)

        tower.pos = {x = x, y = y}
        table.insert(out, tower)
    end

    return out
end

function sky_init()
    local factions = 2

    local unit_types= {}
    unit_types[1] = {
        tag = "agent",
        max_hp = 100,
        shape = {
            body="triangle",
            base_len=10.0
        },
        death_penalty=-100,
        damage_recv_penalty=0,
        damage_deal_reward=0,
        speed=40.0,
        attack_range=1.0,
        attack_dmg=10,
        attack_delay=1.0,
    }

    unit_types[2] = {
        tag="small_tower",
        max_hp = 10,
        shape = {
            body="rect",
            width=20.0,
            height=20.0
        },
        can_move=false,
        kill_reward=150,
        damage_recv_penalty=0,
        damage_deal_reward=0,
        attack_range=20.0,
        attack_dmg=1,
        attack_delay=1.5,
    }

    unit_types[3] = {
        tag="big_tower",
        max_hp=100,
        shape = {
            body="rect",
            width=40.0,
            height=40.0,
        },
        can_move=false,
        kill_reward=1000,
        damage_recv_penalty=0,
        damage_deal_reward=0,
        attack_range=20.0,
        attack_dmg=50,
        attack_delay=1.5,
    }

    return {
        unit_types = unit_types,
        factions=factions,
        victory_reward=0,
        failure_penalty=0,
    }
end

function on_death(world, dead, cause)
    if dead:faction() == 1 then
        world:victory(0)
    else
        world:victory(1)
    end
end