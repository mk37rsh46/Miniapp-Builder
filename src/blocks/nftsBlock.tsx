
import { useEffect, useState } from 'react';
import {
  fetchOpenseaAssets,
  resolveEnsDomain,
  isEnsDomain
} from './utils/OpenSeaAPI';
import { OpenseaAsset } from './types/OpenseaAsset';
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import ViewListIcon from '@mui/icons-material/ViewList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';


import Block from './Block'
import { BlockModel } from './types'


import BlockFactory from './BlockFactory';
import './BlockStyles.css'
import { ImageList, ImageListItem, Switch, Theme, ToggleButton, ToggleButtonGroup } from '@mui/material';


export const PIXELS_FARM_CONTRACT = "0x5C1A0CC6DAdf4d0fB31425461df35Ba80fCBc110"
interface NftGridProps {
  /**
   * Ethereum address (`0x...`) or ENS domain (`vitalik.eth`) for which the gallery should contain associated NFTs.
   * Required.
   */
  ownerAddress: string;

}
function NFTGrid(props: NftGridProps) {

  const [assets, setAssets] = useState([] as OpenseaAsset[]);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadAssetsPage(props.ownerAddress)
  }, [])

  const loadAssetsPage = async (
    ownerAddress: NftGridProps['ownerAddress'],
  ) => {
    setIsLoading(true);
    const owner = isEnsDomain(ownerAddress)
      ? await resolveEnsDomain(ownerAddress)
      : ownerAddress;

    const {
      assets: rawAssets,
      hasError,
      nextCursor,
    } = await fetchOpenseaAssets({
      owner,
      contract: PIXELS_FARM_CONTRACT

    });
    if (hasError) {
      setHasError(true);
    } else {
      setHasError(false);
      // setAssets((prevAssets) => [...prevAssets, ...rawAssets]);
      setAssets(rawAssets)
    }
    setIsLoading(false);

  }

  return (

    <div style={{ position: "relative", height: '100%', width: "100%" }}>

      <ImageList cols={2} style={{ maxHeight: '100%', position: 'absolute' }}>
        {assets.length === 0 && isLoading ? <h1>Loading...</h1> : assets.map((asset, index) =>
          <ImageListItem key={index}>
            <img src={asset.image_preview_url} key={index} style={{ aspectRatio: 1 }} loading="lazy" />
          </ImageListItem>
        )}

      </ImageList>
    </div>

  )

}

export default class NFTsBlock extends Block {
  render() {

    if (!this.model.data['imageViewMode']) {
      this.model.data['imageViewMode'] = 'grid'
    }
    if (Object.keys(this.model.data).length === 0 || !this.model.data['ownerAddress']) {
      return BlockFactory.renderEmptyState(this.model, this.onEditCallback!)
    }

    const ownerAddress = this.model.data["ownerAddress"]

    return (
      <NFTGrid ownerAddress={ownerAddress} />
    );
  }



  renderEditModal(done: (data: BlockModel) => void) {

    const onFinish = (event: any) => {
      event.preventDefault();
      const data = new FormData(event.currentTarget);
      this.model.data['ownerAddress'] = data.get('ownerAddress') as string
      this.model.data['contractAddress'] = data.get('contractAddress') as string
      const mode = data.get('imageViewMode')
      console.log("Got mode", mode)
      done(this.model)
    };

    const ImageViewModeToggle = () => {
      const [imageViewMode, setImageViewMode] = useState<string | null>(this.model.data['imageViewMode']);
      const handleToggleChange = (
        event: React.MouseEvent<HTMLElement>,
        value: string,
      ) => {
        const val = value ?? this.model.data['imageViewMode']
        this.model.data['imageViewMode'] = val
        setImageViewMode(val)
        console.log("model", this.model.data['imageViewMode'])
      };
    
      return (

        <div style={{marginTop:'10px'}}
        >
        <div style={{marginBottom: '5px'}}>Image Layout:</div>
        <ToggleButtonGroup
          exclusive
          value={imageViewMode}
          onChange={handleToggleChange}
          id="imageViewMode"
        >
          <ToggleButton value="grid" key="grid" aria-label="grid">
            <ViewModuleIcon />
          </ToggleButton>

          <ToggleButton value="list" key="list" aria-label="list">
            <ViewListIcon />
          </ToggleButton>
        </ToggleButtonGroup>
        </div>
      );
    }


    return (
      <Box
        component="form"
        onSubmit={onFinish}
        style={{}}
      >
        <TextField
          margin="normal"
          required
          defaultValue={this.model.data['ownerAddress']}
          fullWidth
          id="ownerAddress"
          label="NFT Wallet Address"
          name="ownerAddress"
        />
        <TextField
          defaultValue={this.model.data['contractAddress']}
          fullWidth
          id="contractAddress"
          label="NFT contract address (optional)"
          name="contractAddress"
        />
        <ImageViewModeToggle />
        <Button
          type="submit"
          variant="contained"
          className="save-modal-button"
          sx={{ mt: 3, mb: 2 }}
        >
          Save
        </Button>
      </Box>
    )
  }

  renderErrorState() {
    return (
      <h1>Error!</h1>
    )
  }
}