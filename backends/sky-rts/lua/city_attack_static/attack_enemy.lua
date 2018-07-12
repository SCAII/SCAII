function gen_tower(rng, x, y, faction, out)
    types = {"Small Tower", "Big Tower", "Small City", "Big City"}

    tower_type = rng:rand_int(1,#types+1)

    -- Only select cities ~40% of the time
    if tower_type > 2 and rng:rand_double(0,1) < 0.6 then
        tower_type = tower_type - 2
    end
    tower = {
        pos = {x=x, y=y},
        faction = faction,
        unit_type = types[tower_type],
    }

    if tower_type == 1 then
        tower.hp = rng:rand_double(15, 50)
    elseif tower_type == 2 then
        tower.hp = rng:rand_double(15, 70)
    else
        -- Only friendly towers for now
        tower.faction = 0
        tower.hp = rng:rand_double(20, 70)
    end


    table.insert(out, tower)
end



function _reset(rng, data)
    local agent = {
        pos = {x=20.0, y=20.0},
        unit_type="Ship",
        faction=0,
    }

    if data == nil then
        generation = 1
    elseif data.generation == nil then
        data.generation = 2
        generation = 2
    elseif data.generation > 1 then
        data.generation = data.generation + 1
        generation = data.generation
    end

    if generation > 3 then
        print "uh oh"
    end



    out = {}
    table.insert(out, agent)

    local full_hp_small = {
        unit_type="Small Tower",
        hp=37,
        faction=0
    }

    local damaged_small = {
        unit_type="Small Tower",
        faction=1,
        hp=25.27692,
    }

    local damaged_big = {
        unit_type="Big Tower",
        faction=1,
        hp=45.0,
    }

    local friendly_small = {
        unit_type="Small Tower",
        faction=0,
    }

    -- Reminder:
    -- Q1 = 2
    -- Q2 = 4
    -- Q3 = 3
    -- Q4 = 1
    if generation == 1 then
        -- Q3, Q4, Q1, Q2 = 3, 1, 2, 4
        full_hp_small.pos = {x=10.8, y=31.5}
        damaged_small.pos = {x=26.3, y=31.2}
        damaged_big.pos = {x=35.0, y=10.0}
        friendly_small.pos = {x=13.8, y=8.0}

        table.insert(out, damaged_small)
        table.insert(out, damaged_big)
        table.insert(out, full_hp_small)
        table.insert(out, friendly_small)
    elseif generation == 2 then
        -- Q4, Q3, Q1, Q2 = 1, 3, 2, 4
        full_hp_small.pos = {x=26.3, y=31.2}
        damaged_small.pos = {x=10.8, y=31.5}
        damaged_big.pos = {x=35.0, y=10.0}
        friendly_small.pos = {x=13.8, y=8.0}

        table.insert(out, full_hp_small)
        table.insert(out, damaged_big)
        table.insert(out, damaged_small)
        table.insert(out, friendly_small)
    else
        -- Q1, Q2, Q4, Q3 = 2, 4, 1, 3
        full_hp_small.pos = {x=35.0, y=10.0}
        damaged_small.pos = {x=13.8, y=8.0}
        damaged_big.pos = {x=26.3, y=31.2}
        friendly_small.pos = {x=10.8, y=31.5}

        
        table.insert(out, damaged_big)
        table.insert(out, full_hp_small)
        table.insert(out, friendly_small)
        table.insert(out, damaged_small)
        
    end

    return out
end

function sky_reset(rng)
    return _reset(rng, nil)
end

function on_spawn(world, unit)
    world:override_skip(true)
end

function sky_init()
    local factions = 2

    local unit_types= {}
    unit_types[1] = {
        tag = "Ship",
        max_hp = 80,
        shape = {
            body="triangle",
            base_len=2.0,
        },
        kill_reward=70,
        kill_type="Enemy Destroyed",
        dmg_deal_type="Enemy Damaged",
        death_penalty=0,
        damage_recv_penalty=0,
        speed=40.0,
        attack_range=0.3,
        attack_dmg=10,
        attack_delay=0.2,
    }

    unit_types[2] = {
        tag="Small Tower",
        max_hp = 50,
        shape = {
            body="rect",
            width=3.0,
            height=3.0,
        },
        can_move=false,
        kill_reward=50,
        kill_type="Enemy Destroyed",
        death_type="Friend Destroyed",
        dmg_recv_type="Friend Damaged",
        dmg_deal_type="Enemy Damaged",
        damage_deal_reward=0,
        attack_range=0.3,
        attack_dmg=5,
        attack_delay=0.2,
    }

    unit_types[3] = {
        tag="Big Tower",
        max_hp=70,
        shape = {
            body="rect",
            width=5.0,
            height=5.0,
        },
        can_move=false,
        kill_reward=85,
        kill_type="Enemy Destroyed",
        death_type="Friend Destroyed",
        dmg_recv_type="Friend Damaged",
        dmg_deal_type="Enemy Damaged",
        damage_deal_reward=0,
        attack_range=0.3,
        attack_dmg=10,
        attack_delay=0.2,
    }

    unit_types[4] = {
        tag="Big City",
        max_hp=70,
        shape = {
            body="circle",
            radius=3,
        },
        can_move=false,
        kill_reward=-115,
        death_penalty=-115,
        kill_type="City Destroyed",
        death_type="City Destroyed",
        dmg_recv_type="City Damaged",
        dmg_deal_type="City Damaged",
        damage_deal_reward=-10,
        damage_recv_penalty=-10,
        attack_range=0,
        attack_dmg=0,
        attack_delay=999,
    }

    unit_types[5] = {
        tag="Small City",
        max_hp=70,
        shape = {
            body="circle",
            radius=1.5,
        },
        can_move=false,
        kill_reward=-100,
        death_penalty=-100,
        kill_type="City Destroyed",
        death_type="City Destroyed",
        dmg_recv_type="City Damaged",
        dmg_deal_type="City Damaged",
        damage_deal_reward=-10,
        damage_recv_penalty=-10,
        attack_range=0,
        attack_dmg=0,
        attack_delay=999,
    }

    return {
        unit_types = unit_types,
        factions=factions,
        victory_reward=0,
        failure_penalty=0,
        reward_types={"Enemy Destroyed", "Friend Destroyed", "City Destroyed", "City Damaged", "Friend Damaged", "Enemy Damaged"},
    }
end

function on_death(world, dead, cause)
    -- Filter out the enemy ship killing a tower/being killed by a tower 
    if (cause:unit_type() == "Ship" and cause:faction() == 1 and dead:unit_type() ~= "Ship")
    --    (dead:unit_type() == "Ship" and dead:faction() == 1 and cause:unit_type() ~= "Ship")
    -- Note: we need to actually filter this out because otherwise games can stall indefinitely
    then 
        return 
    end
    
    if dead:unit_type() == "Ship" and dead:faction() == 0 then
        world:victory(0)
        return
    end

    world:delete_all()

    -- We'll just use our reset function to generate
    -- the next board and tweak it to our liking
    new_board = _reset(world:rng(), world)
    for _k,entity in pairs(new_board) do
        -- Carry over agent HP to next iteration
        if entity.unit_type == "Ship" and entity.faction == 0 then
            entity.hp = cause:hp() -- Due to the nature of the scenario, if the agent didn't die they caused the death
        end

        world:spawn(entity)
    end
end