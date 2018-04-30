function gen_tower(rng,x,out)
    types = {"small_tower", "big_tower"}

    tower_type = rng:rand_int(1,2+1)
    if tower_type == 1 then
        max_hp = 50
    else
        max_hp = 70
    end
    tower = {
        pos = {x=x, y=20},
        hp = rng:rand_double(30.0, max_hp),
        faction = 1,
        unit_type = types[tower_type],
    }

    table.insert(out, tower)
end

function on_spawn(world, unit)
end

function sky_reset(rng)
    local agent = {
        pos = {x=20.0, y=20.0},
        unit_type="agent",
        faction=0,
    }

    out = {}
    table.insert(out, agent)

    gen_tower(rng,10,out)
    gen_tower(rng,30,out)

    return out
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
        death_penalty=-100,
        death_type="agent_death",
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
        death_penalty=0,
        kill_type="bonus",
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
        death_penalty=0,
        kill_reward=70,
        kill_type="bonus",
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
        reward_types={"agent_death","bonus","took_damage","dealt_damage"},
        max_steps=70,
    }
end

function on_death(world, dead, cause)
    if dead:faction() == 1 then
        world:victory(0)
    else
        world:victory(1)
    end
end