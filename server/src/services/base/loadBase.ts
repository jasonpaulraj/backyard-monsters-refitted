import { Context } from "koa";
import { ORMContext } from "../../server";
import { Save } from "../../models/save.model";
import { getWildMonsterSave } from "../maproom/v2/wildMonsters";
import { User } from "../../models/user.model";
import { logging } from "../../utils/logger";

export const loadViewBase = async (baseid: string): Promise<Save> => {
    const fork = ORMContext.em.fork();

    let save = await fork.findOne(Save, {
        baseid: baseid,
    });

    if (save && save.wmid !== 0) {
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const diff = currentTimestamp - save.savetime;
        if (diff > 3600) {
            await ORMContext.em.removeAndFlush(save)
        }
    }

    if (!save) {
        logging("Loading wild monster default base")
        save = getWildMonsterSave(parseInt(baseid));
    }

    return save;
}

export const loadBuildBase = async (ctx: Context, baseid: string): Promise<Save> => {
    const fork = ORMContext.em.fork();
    const user: User = ctx.authUser;
    await fork.populate(user, ["save"]);
    const authSave: Save = user.save;
    let save = authSave;

    if (baseid !== "0" && baseid !== authSave.baseid) {
        save = await fork.findOne(Save, {
            baseid: baseid
        })

        if (save.saveuserid === user.userid) {
            save.credits = authSave.credits;
            save.resources = authSave.resources;
            save.outposts = authSave.outposts;
            save.buildingresources = authSave.buildingresources;
        }
    }

    return save;
}