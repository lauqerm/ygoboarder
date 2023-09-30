import axios, { AxiosResponse } from 'axios';
import { RcFile, ImgurResponse } from 'src/model';

export const uploadToImgur = (
    fileData: RcFile,
    {
        onFinish,
        onError,
        onSuccess,
        onBeforeStart,
    }: {
        onBeforeStart: (readerResult: string, fileData: RcFile) => void,
        onSuccess: (response: AxiosResponse<ImgurResponse>, fileData: RcFile) => void,
        onError: (error: any, fileData: RcFile) => void,
        onFinish: () => void,
    },
) => {
    const reader = new FileReader();

    reader.onload = async e => {
        const { target } = e;
        if (target) {
            const { result } = target;
            if (typeof result === 'string') {
                onBeforeStart(result, fileData);

                try {
                    const imgurFormData = new FormData();
                    imgurFormData.append('image', fileData);

                    const response = await axios.post<ImgurResponse>(
                        'https://api.imgur.com/3/image',
                        imgurFormData,
                        {
                            headers: {
                                'Authorization': 'Client-ID f9bbe0da263580e',
                            },
                        },
                    );
                    onSuccess(response, fileData);
                } catch (e: any) {
                    onError(e, fileData);
                }
                onFinish();
            }
        }
    };
    reader.readAsDataURL(fileData);
};