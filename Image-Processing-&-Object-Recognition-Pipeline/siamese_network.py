import torch
import torch.nn as nn
import torchvision.models as models

class SiameseNetwork(nn.Module):
    def __init__(self):
        super(SiameseNetwork, self).__init__()
        # Load pretrained ResNet-18
        # Using weights=models.ResNet18_Weights.DEFAULT for the best available weights
        self.resnet = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)
        
        # Modify the fully connected layer to output a 128-dimensional embedding vector
        # The original fc layer has 512 input features
        in_features = self.resnet.fc.in_features
        self.resnet.fc = nn.Linear(in_features, 128)

    def forward_one(self, x):
        """
        Get embeddings for a single image.
        """
        return self.resnet(x)

    def forward(self, x1, x2):
        """
        Get embeddings for two images (standard Siamese architecture).
        """
        output1 = self.forward_one(x1)
        output2 = self.forward_one(x2)
        return output1, output2
