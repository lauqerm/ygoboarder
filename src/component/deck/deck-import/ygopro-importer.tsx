import { Input } from 'antd';
import axios from 'axios';
import queryString from 'query-string';
import { useEffect, useRef, useState } from 'react';
import { YGOProCardResponse, ygoproCardToDescription } from 'src/model';
import throttle from 'lodash.throttle';
import { AttributeText, RestrictionText } from 'src/component/atom';
import { DelayedImage } from 'src/component';
import styled from 'styled-components';
import './ygopro-importer.scss';

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

const YGOImporterContainer = styled.div`
    .ygopro-card-entry {
        position: relative;
        display: grid;
        grid-template-columns: 86px 1fr;
        column-gap: var(--spacing);
        margin-top: var(--spacing-xs);
        cursor: pointer;
        &:hover {
            background-color: var(--sub-antd);
        }
        .image-container {
            position: relative;
        }
        .card-entry-image {
            width: 86px;
            img {
                max-width: 100%;
            }
            .stat-list {
                position: absolute;
                display: grid;
                grid-template-columns: 1fr 1fr;
                font-family: monospace;
                bottom: 0;
                width: 100%;
                text-align: right;
                background-color: #333333dd;
                padding: var(--spacing-xs);
                column-gap: var(--spacing-xs);
                .stat {
                    background-color: #fafafadd;
                    padding: 0 var(--spacing-xs);
                }
            }
            .restriction-text {
                position: absolute;
                top: 0;
                left: 0;
                border-radius: 0 0 var(--br) 0;
                border: var(--bd-blunt);
            }
        }
        .main-statistic {
            color: #000000;
            .rate,
            .attribute-text {
                display: inline-block;
                width: 65px;
            }
        }
        p {
            margin-top: var(--spacing-xs);
            margin-bottom: 0;
            line-height: 1.45;
            white-space: pre-line;
        }
    }
`;

export type YGOProImporter = {
    onSelect: (name: string, url: string, description: string) => void,
}
export const YGOProImporter = ({
    onSelect,
}: YGOProImporter) => {
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

    return <YGOImporterContainer className="ygopro-importer">
        <Input.Search
            onSearch={async value => {
                setPayload(curr => ({ ...curr, fname: value }));
            }}
        />
        <div className="ygopro-card-list">
            {cardResponseList
                .slice(0, 20)
                .map(card => {
                    const {
                        id,
                        card_images,
                        name,
                        desc,
                        type,
                        attribute,
                        frameType,
                        level,
                        linkval,
                        atk, def,
                        race,
                        banlist_info,
                    } = card;
                    const { ban_ocg } = banlist_info ?? {};
                    const { image_url_small } = card_images[0];
                    const isMonster = type.toLowerCase().includes('monster')
                        || type.toLowerCase().includes('token');
                    const isXyzMonster = frameType === 'xyz';
                    const isLinkMonster = frameType === 'link';

                    return <div key={id}
                        className="ygopro-card-entry"
                        onClick={() => onSelect(name, image_url_small, ygoproCardToDescription(card))}
                    >
                        <div className="card-entry-image">
                            <div className="image-container">
                                <RestrictionText limit={ban_ocg} />
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
    </YGOImporterContainer>;
};