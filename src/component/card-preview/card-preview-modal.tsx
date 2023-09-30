import { usePreviewState } from 'src/state';
import { Modal } from 'antd';
import { CardPreviewer } from './card-preview';
import './card-preview-modal.scss';

export type CardPreviewerModal = {};
export const CardPreviewerModal = (_: CardPreviewerModal) => {
    const setPreview = usePreviewState(state => state.setPreview);
    const isModalMode = usePreviewState(state => state.isModalMode);

    return <Modal
        title="Card Preview"
        width={'55rem'}
        mask
        wrapClassName="card-preview-modal"
        open={isModalMode}
        onCancel={() => setPreview('side')}
        cancelText="Dismiss"
        destroyOnClose
    >
        <CardPreviewer
            layout="horizontal"
            afterSubmitMode="modal"
        />
    </Modal>;
};