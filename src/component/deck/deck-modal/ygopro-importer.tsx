import { Input } from 'antd';
import axios from 'axios';
import queryString from 'query-string';
import { useEffect, useRef, useState } from 'react';
import { YGOProCardResponse } from 'src/model';
import throttle from 'lodash.throttle';
import { DelayedImage } from 'src/component';
import './ygopro-importer.scss';
import { AttributeText } from 'src/component/atom';

type RequestorPayload = {
    fname?: string,
}
const requestor = async (payload: RequestorPayload) => {
    const normalizedPayload = (payload: RequestorPayload) => {
        const finalPayload: RequestorPayload = {};
        const { fname } = payload;

        if (typeof fname === 'string' && fname.length > 0) finalPayload.fname = fname;

        return finalPayload;
    };
    const queryParam = queryString.stringify(normalizedPayload(payload));

    if ((queryParam ?? '').length === 0) return undefined;

    return (await axios<{ data: YGOProCardResponse[] }>(`https://db.ygoprodeck.com/api/v7/cardinfo.php?${queryParam}`)).data.data;
};

export type YGOProImporter = {

}
export const YGOProImporter = () => {
    const [payload, setPayload] = useState<RequestorPayload>({});
    const [cardResponseList, setCardResponseList] = useState<YGOProCardResponse[]>([]);
    const throttledRequest = useRef(throttle(requestor, 100));
    useEffect(() => {
        let relevant = true;

        (async () => {
            try {
                const response = await throttledRequest.current(payload);

                if (relevant && response) setCardResponseList(response);
            } catch (e) {
                console.error(e);
            }
        })();

        return () => {
            relevant = false;
        };
    }, [payload]);

    return <div className="ygopro-importer">
        <Input.Search
            onSearch={async value => {
                setPayload(curr => ({ ...curr, fname: value }));
            }}
        />
        <div className="ygopro-card-list">
            {cardResponseList
                .slice(0, 20)
                .map(card => {
                    const { id, card_images, name, desc, type, attribute, frameType, level, linkval, atk, def, race } = card;
                    const { image_url_small } = card_images[0];
                    const isMonster = type.toLowerCase().includes('monster')
                        || type.toLowerCase().includes('token');
                    const isXyzMonster = frameType === 'xyz';
                    const isLinkMonster = frameType === 'link';

                    return <div key={id} className="ygopro-card-entry">
                        <div className="card-entry-image">
                            <div className="image-container">
                                {typeof image_url_small !== 'string'
                                    ? null
                                    : <DelayedImage key={id}
                                        type="URL"
                                        src={image_url_small}
                                    />}
                                <div className="stat-list">
                                    <div className="stat">{atk}</div>
                                    <div className="stat">{def}</div>
                                </div>
                            </div>
                        </div>
                        <div className="card-statistic">
                            <b>{name}</b>
                            <br />
                            <div className="main-statistic truncate">
                                {isXyzMonster
                                    ? <div className="rate">RANK&nbsp;&nbsp;{level}</div>
                                    : isLinkMonster
                                        ? <div className="rate">LINK&nbsp;&nbsp;{linkval}</div>
                                        : isMonster
                                            ? <div className="rate">LEVEL&nbsp;{level}</div>
                                            : null}
                                {isMonster && <AttributeText attribute={attribute} />}
                                <span className="truncate">{race} {type}</span>
                            </div>
                            <p>{desc}</p>
                        </div>
                    </div>;
                })}
        </div>
    </div>;
};