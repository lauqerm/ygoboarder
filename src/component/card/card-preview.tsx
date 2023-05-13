import { usePreviewStore } from 'src/state';
import styled from 'styled-components';
import { DelayedImage } from './card-image';
import { CardBack } from '../atom';

const CardPreviewContainer = styled.div`
    .card-preview-image-container {
        width: var(--card-width-md);
        height: var(--card-height-md);
        display: flex;
        flex-direction: column;
        justify-content: center;
        > img {
            max-width: 100%;
            max-height: 100%;
        }
    }
`;
export const CardPreviewer = () => {
    const {
        data,
        dataURL,
        type,
    } = usePreviewStore(
        state => state.cardPreview,
        (prev, next) => {
            if (prev.type !== next.type) return false;
            return (next.type === 'external' && prev.dataURL === next.dataURL)
                || (next.type === 'internal' && prev.data === next.data);
        },
    );
    const noCard = (type === 'external' && dataURL.length <= 0)
        || (type === 'internal' && data.length <= 0);

    return <CardPreviewContainer className="card-preview">
        <div className="card-preview-image-container">
            {noCard
                ? <CardBack size="md" className="card-preview-image" />
                : <DelayedImage
                    className="card-preview-image"
                    type={type === 'external' ? 'URL' : 'Base64'}
                    src={type === 'external' ? dataURL : data}
                />}
        </div>
        <div className="card-preview-description">

        </div>
    </CardPreviewContainer>;
};