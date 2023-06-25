import { Pagination, Radio, Select, notification } from 'antd';
import { useEffect, useState } from 'react';
import { CardBitToLabelMap, LocalstorageKeyMap, YGOProCard, ygoproCardToDescription } from 'src/model';
import { AttributeText, CheckboxGroup, RestrictionText } from 'src/component/atom';
import { DelayedImage } from 'src/component';
import styled from 'styled-components';
import { OrderList, usePreviewState, useYGOProFilter } from 'src/state';
import { mergeClass } from 'src/util';
import { YGOImporterFilter } from './ygopro-importer-filter';
import { LoadingOutlined } from '@ant-design/icons';
import { YGOProRequestor } from './ygopro-importer-requestor';
import { Loading } from 'src/component/loading';
import './ygopro-importer.scss';

const YGOImporterContainer = styled.div`
    position: relative;
    .display-mode {
        width: 100%;
    }
    .ygopro-filter {
        top: 0;
        position: sticky;
        background-color: var(--dim);
        z-index: 1;
        padding-top: var(--spacing);
    }
    .ygopro-importer-title {
        display: grid;
        grid-template-columns: 1fr max-content max-content max-content;
        column-gap: var(--spacing);
        margin-bottom: 0;
        .ant-radio-group {
            font-weight: normal;
        }
        .title-filter {
            line-height: 1;
            margin-top: var(--spacing-xs);
        }
        .label {
            font-weight: normal;
            margin-right: var(--spacing-sm);
            display: inline;
            font-size: var(--fs-sm);
        }
        .ant-radio-button-wrapper {
            padding: 0 var(--spacing-sm);
        }
    }
    .ygopro-card-entry {
        position: relative;
        display: grid;
        grid-template-columns: 86px 1fr;
        column-gap: var(--spacing);
        margin-bottom: var(--spacing);
        padding-top: var(--spacing);
        cursor: pointer;
        &:hover {
            .card-statistic b {
                color: var(--sub-antd);
                text-decoration: underline;
            }
        }
        + .ygopro-card-entry {
            border-top: var(--bd-faint);
        }
        .image-container {
            position: relative;
        }
        .card-entry-image {
            width: var(--card-width-sm);
            .image-container {
                height: var(--card-height-sm);
            }
            img {
                max-width: 100%;
                max-height: 100%;
            }
            .stat-list {
                display: grid;
                grid-template-columns: 1fr 1fr;
                font-family: monospace;
                width: 100%;
                text-align: right;
                background-color: #333333dd;
                padding: var(--spacing-xs);
                column-gap: var(--spacing-xs);
                .stat {
                    background-color: #fafafadd;
                    padding: 0 var(--spacing-xs);
                    line-height: 1.15;
                }
            }
            .restriction-text {
                position: absolute;
                bottom: 0;
                left: 0;
                border-radius: 0 var(--br) 0 0;
                border: var(--bd-blunt);
                box-shadow: 0 0 var(--bdSize) var(--bdSize) white;
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
    .ygopro-card-list {
        position: relative;
        min-height: 10rem;
        &.grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, 168px);
            gap: var(--spacing);
            margin-top: var(--spacing);
            .stat-list,
            .card-statistic {
                display: none;
            }
            /** Size của ygopro */
            .ygopro-card-entry {
                margin: 0;
                padding: 0;
                border: none;
                &:hover {
                    outline: 4px solid var(--main-antd);
                }
            }
            .restriction-text {
                font-size: var(--fs-xl);
                border-radius: 0 var(--br) 0 0;
            }
            .card-entry-image {
                width: 168px;
                height: 246px;
                .image-container {
                    height: unset;
                }
            }
        }
    }
    .card-list-control {
        display: grid;
        grid-template-columns: 85px 1fr;
        column-gap: var(--spacing);
        padding-top: var(--spacing);
        .card-list-pagination {
            text-align: right;
        }
        /** Không thể customize text nên ta phải can thiệp bằng cách khác */
        .ant-pagination-options-quick-jumper {
            font-size: 0;
            input {
                margin-right: 0;
                padding: 0 var(--spacing-xs);
            }
            &:before {
                content: "Page";
                font-size: var(--fs);
            }
        }
    }
`;

export type YGOProImporter = {
    id: string,
    onSelect: (name: string, url: string, description: string) => void,
}
export const YGOProImporter = ({
    id,
    onSelect,
}: YGOProImporter) => {
    const filterKey = 'modal-importer';
    const [cardResponseList, setCardResponseList] = useState<YGOProCard[]>([]);
    const [displayMode, setDisplayMode] = useState('grid');
    const [loading, setLoading] = useState(false);
    const [ready, setReady] = useState(false);
    const [banlist, setBanlist] = useState<string>(localStorage.getItem(LocalstorageKeyMap.banlist) ?? 'no');
    const [cardpool, setCardPool] = useState<string[]>(localStorage.getItem(LocalstorageKeyMap.cardpool)
        ? JSON.parse(localStorage.getItem(LocalstorageKeyMap.cardpool) ?? '[]')
        : ['BOTH', 'TCG', 'OCG']);
    const preview = usePreviewState(state => state.setCardPreview);

    const payload = useYGOProFilter(state => state.payloadMap[filterKey]);
    const activeCardList = useYGOProFilter(state => state.activeCardList[filterKey]);
    const cardListStatus = useYGOProFilter(state => state.status);
    const initCardList = useYGOProFilter(state => state.init);
    const activeListKey = useYGOProFilter(state => state.activeCardListKey[filterKey]);
    const changeActiveList = useYGOProFilter(state => state.changeActiveCardList);
    const [cardPage, setCardPage] = useState(1);
    const [cardPageSize, setCardPageSize] = useState(20);

    useEffect(() => {
        let relevant = true;

        (async () => {
            try {
                await initCardList();

                if (relevant) setReady(true);
            } catch (e) {
                if (relevant) {
                    notification.error({
                        message: 'Could not load card data',
                        description: 'Please refresh the page',
                        placement: 'bottomRight',
                    });
                    setReady(true);
                }
            }
        })();

        return () => {
            relevant = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        changeActiveList(filterKey, 'level');   
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        let relevant = true;

        if (cardListStatus === 'loaded') (async () => {
            try {
                setLoading(true);
                const resultCardList = await YGOProRequestor(payload, activeCardList ?? [], cardpool, banlist);

                if (relevant) setLoading(false);
                if (relevant && resultCardList) {
                    setCardResponseList(resultCardList);
                    setCardPage(1);
                }
            } catch (e: any) {
                if (e.code === 'ERR_BAD_REQUEST') notification.error({
                    message: 'No cards match your search',
                    description: 'Please try different filter',
                    placement: 'bottomRight',
                });
                else console.error(e);
                if (relevant) {
                    setLoading(false);
                    setCardPage(1);
                }
            }
        })();

        return () => {
            relevant = false;
        };
    }, [activeCardList, cardListStatus, payload, cardpool, banlist]);

    return <YGOImporterContainer className="ygopro-importer">
        <h2 className="ygopro-importer-title">
            <div>
                YGOPRO Importer&nbsp;&nbsp;{loading && <LoadingOutlined />}
            </div>
            <div className="title-filter">
                <div className="label">Pool</div>
                <CheckboxGroup
                    className="cardpool"
                    optionList={[
                        { label: 'OCG exclusive', value: 'OCG', defaultChecked: cardpool.includes('OCG') },
                        { label: 'Global', value: 'BOTH', defaultChecked: cardpool.includes('BOTH') },
                        { label: 'TCG exclusive', value: 'TCG', defaultChecked: cardpool.includes('TCG') },
                    ]}
                    onChange={value => {
                        setCardPool(value);
                        localStorage.setItem(LocalstorageKeyMap.cardpool, JSON.stringify(value));
                    }}
                />
            </div>
            <div className="title-filter">
                <div className="label">Banlist</div>
                <Radio.Group
                    size="small"
                    className="banlist-mode"
                    options={[
                        { label: 'OCG', value: 'ocg' },
                        { label: 'TCG', value: 'tcg' },
                        { label: 'No', value: 'no' },
                    ]}
                    onChange={e => {
                        setBanlist(e.target.value);
                        localStorage.setItem(LocalstorageKeyMap.banlist, e.target.value);
                    }}
                    value={banlist}
                    optionType="button"
                    buttonStyle="solid"
                />
            </div>
            <Radio.Group
                size="small"
                className="display-mode title-filter"
                options={[
                    { label: 'List', value: 'list' },
                    { label: 'Grid', value: 'grid' },
                ]}
                onChange={e => setDisplayMode(e.target.value)}
                value={displayMode}
                optionType="button"
                buttonStyle="solid"
            />
        </h2>
        <YGOImporterFilter id={filterKey} ready={ready}>
            <div className="card-list-control">
                <Select
                    size="small"
                    options={OrderList}
                    value={activeListKey}
                    onChange={value => {
                        changeActiveList(filterKey, value);
                    }}
                />
                <Pagination
                    className="card-list-pagination"
                    size="small"
                    current={cardPage}
                    pageSize={cardPageSize}
                    total={cardResponseList.length}
                    pageSizeOptions={['20', '40', '80', '160']}
                    showSizeChanger
                    showQuickJumper
                    showTotal={(total) => <div>{total}</div>}
                    onShowSizeChange={(_, newSize) => {
                        setCardPageSize(newSize);
                        setCardPage(1);
                    }}
                    onChange={page => {
                        setCardPage(page);
                    }}
                />
            </div>
        </YGOImporterFilter>
        <div className={mergeClass('ygopro-card-list', displayMode)}>
            {ready === false && <Loading.FullView />}
            {cardResponseList
                .slice((cardPage - 1) * cardPageSize, cardPage * cardPageSize)
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
                        pool_binary,
                    } = card;
                    const { ban_ocg, ban_tcg } = banlist_info ?? {};
                    const { image_url } = card_images[0];
                    const isMonster = type.toLowerCase().includes('monster')
                        || type.toLowerCase().includes('token');
                    const isXyzMonster = frameType === 'xyz';
                    const isLinkMonster = frameType === 'link';

                    return <div key={id}
                        className="ygopro-card-entry"
                        onClick={() => onSelect(name, image_url, ygoproCardToDescription(card))}
                        onMouseEnter={() => {
                            // console.log(card);
                            preview('external', image_url, true, ygoproCardToDescription(card));
                        }}
                    >
                        <div className="card-entry-image">
                            <div className="image-container">
                                <RestrictionText
                                    prefix={CardBitToLabelMap[`${pool_binary}`]}
                                    limitList={[
                                        { format: 'ocg', limit: ban_ocg },
                                        { format: 'tcg', limit: ban_tcg },
                                    ].filter(entry => entry.format === banlist)}
                                />
                                {typeof image_url !== 'string'
                                    ? null
                                    : <DelayedImage key={id}
                                        type="URL"
                                        src={image_url}
                                    />}
                            </div>
                            {(atk !== undefined || def !== undefined) && <div className="stat-list">
                                <div className="stat">{atk}</div>
                                <div className="stat">{def}</div>
                            </div>}
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
