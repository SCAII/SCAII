function gen_tower(rng, x, y, faction, out)
    types = {"small_tower", "big_tower"}

    tower_type = rng:rand_int(1,2+1)
    if tower_type == 1 then
        max_hp = 50
    else
        max_hp = 70
    end
    tower = {
        pos = {x=x, y=y},
        hp = rng:rand_double(15.0, max_hp),
        faction = faction,
        unit_type = types[tower_type],
    }

    table.insert(out, tower)
end

function sky_reset(rng)
    local agent = {
        pos = {x=20.0, y=20.0},
        unit_type="agent",
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

    return out
end

function on_spawn(world, unit)
    world:override_skip(true)
end

function sky_init()
    local factions = 2

    local unit_types= {}
    unit_types[1] = {
        tag = "agent",
        max_hp = 50,
        shape = {
            body="triangle",
            base_len=2.0,
        },
        kill_reward=0,
        death_penalty=0,
        dmg_recv_type="took_damage",
        dmg_deal_type="dealt_damage",
        speed=40.0,
        attack_range=0.3,
        attack_dmg=10,
        attack_delay=0.2,
    }

    unit_types[2] = {
        tag="small_tower",
        max_hp = 50,
        shape = {
            body="rect",
            width=3.0,
            height=3.0,
        },
        can_move=false,
        kill_reward=50,
        kill_type="bonus",
        death_type="friendly_kill",
        damage_recv_penalty=0,
        damage_deal_reward=0,
        attack_range=0.3,
        attack_dmg=5,
        attack_delay=0.2,
    }

    unit_types[3] = {
        tag="big_tower",
        max_hp=70,
        shape = {
            body="rect",
            width=5.0,
            height=5.0,
        },
        can_move=false,
        kill_reward=70,
        kill_type="bonus",
        death_type="friendly_kill",
        damage_recv_penalty=0,
        damage_deal_reward=0,
        attack_range=0.3,
        attack_dmg=10,
        attack_delay=0.2,
    }

    return {
        unit_types = unit_types,
        factions=factions,
        victory_reward=0,
        failure_penalty=0,
        reward_types={"took_damage", "dealt_damage", "friendly_kill", "bonus"},
    }
end

function on_death(world, dead, cause)
    if dead:unit_type() == "agent" then
        world:victory(0)
        return
    end

    world:delete_all()

    -- We'll just use our reset function to generate
    -- the next board and tweak it to our liking
    new_board = sky_reset(world:rng())
    for _k,entity in pairs(new_board) do
        print(entity.unit_type, entity.faction)
        -- Carry over agent HP to next iteration
        if entity.unit_type == "agent" then
            entity.hp = cause:hp() -- Due to the nature of the scenario, if the agent didn't die they caused the death
        end

        world:spawn(entity)
    end
end