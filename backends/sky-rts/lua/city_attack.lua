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
        -- Only friendly cities for now
        tower.faction = 0
        tower.hp = rng:rand_double(50, 70)
    end


    table.insert(out, tower)
end

function roll_ship(rng, units, agent)
    cities = {}
    for i,tower in pairs(units) do
        if tower.unit_type ~= "Ship" and tower.faction == 0 and (tower.unit_type == "Small City" or tower.unit_type == "Big City") then
            table.insert(cities, i)
        end
    end

    if #cities == 0 then
        return false
    end

    roll = rng:rand_double(0,1)
    if roll < 0.6 then
        return false
    end

    which = rng:rand_int(1, #cities+1)
    idx = cities[which]
    tower = units[idx]


    -- Find how far we need to spawn the ship from the tower
    -- to be outside it (at least mostly)
    --
    -- Code for towers is left in for legacy reasons (i.e. in case we want to go back to it)
    if tower.unit_type == "Big Tower" then
        scale = 5 * math.sqrt(2) / 2
    elseif tower.unit_type == "Small Tower" then
        scale = 3 * math.sqrt(2) / 2
    elseif tower.unit_type == "Small City" then
        scale = 1.5
    elseif tower.unit_type == "Big City" then
        scale = 3
    end

    -- Find unit vector from tower to agent
    -- and scale to needed value
    x = tower.pos.x - agent.pos.x
    y = tower.pos.y - agent.pos.y

    norm = math.sqrt(x*x + y*y)

    x = x / norm
    y = y / norm

    x = x * scale
    y = y * scale

    enemy_ship = {
        pos = {x = tower.pos.x - x, y = tower.pos.y - y},
        unit_type = "Ship",
        faction = 1,
        hp = rng:rand_double(5.0, 25.0)
    }

    -- The python code just attacks the index corresponding to the
    -- given entity, so this hack lets us select the ship as if it
    -- were the tower in that quadrant automagically
    units[idx] = enemy_ship
    table.insert(units, tower)
end

function _reset(rng, data)
    local agent = {
        pos = {x=20.0, y=20.0},
        unit_type="Ship",
        faction=0,
    }

    out = {}
    table.insert(out, agent)


    for i = 4,1,-1 do
        x_max = (( (i-1) // 2) + 1) * 20.0 - 5.5
        
        y_max = (( (i-1) %  2) + 1) * 20.0 - 5.5

        x = rng:rand_double(x_max - 2.5, x_max)
        y = rng:rand_double(y_max - 2.5, y_max)

        faction_weight = rng:rand_double(0.0, 1.0)

        -- About a 70% chance of a tower being an enemy.
        -- May tweak
        if faction_weight < 0.7 then
            faction = 1
        else
            faction = 0
        end

        gen_tower(rng, x, y, faction, out)
    end

    roll_ship(rng, out, agent)

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
        kill_reward=0,
        kill_type="Enemy Destroyed",
        dmg_deal_type="Enemy Damaged",
        death_penalty=0,
        damage_recv_penalty=0,
        -- damage_deal_reward=0,
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
        damage_recv_penalty=-10,
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
        kill_reward=70,
        kill_type="Enemy Destroyed",
        death_type="Friend Destroyed",
        dmg_recv_type="Friend Damaged",
        dmg_deal_type="Enemy Damaged",
        damage_recv_penalty=-10,
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
        reward_types={"Enemy Destroyed", "Friend Destroyed", "City Destroyed", "City Damaged", "Friend Damaged", "Enemy Damaged", "Living"},
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

    world:emit_reward(1, "Living")
    
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