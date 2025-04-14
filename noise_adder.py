import os
import cv2
import numpy as np
import argparse



def add_gausian_noise(image, mean=0, var=0.01):
    """
    Add Gaussian noise to an image.
    
    Parameters:
        image (numpy.ndarray): Input image.
        mean (float): Mean of the Gaussian noise.
        var (float): Variance of the Gaussian noise.
        
    Returns:
        numpy.ndarray: Noisy image.
    """
    sigma = var ** 0.5
    gauss = np.random.normal(mean, sigma, image.shape).astype(np.uint8)
    noisy_image = cv2.add(image, gauss)
    return noisy_image


def add_salt_and_pepper_noise(image, salt_prob=0.01, pepper_prob=0.01):
    """
    Add salt and pepper noise to an image.
    
    Parameters:
        image (numpy.ndarray): Input image.
        salt_prob (float): Probability of adding salt noise.
        pepper_prob (float): Probability of adding pepper noise.
        
    Returns:
        numpy.ndarray: Noisy image.
    """
    noisy_image = np.copy(image)
    total_pixels = image.size
    num_salt = np.ceil(salt_prob * total_pixels)
    num_pepper = np.ceil(pepper_prob * total_pixels)

    # Add salt noise
    coords = [np.random.randint(0, i - 1, int(num_salt)) for i in image.shape]
    noisy_image[coords] = 255

    # Add pepper noise
    coords = [np.random.randint(0, i - 1, int(num_pepper)) for i in image.shape]
    noisy_image[coords] = 0

    return noisy_image


def add_speckle_noise(image, mean=0, var=0.01):
    """
    Add speckle noise to an image.
    
    Parameters:
        image (numpy.ndarray): Input image.
        mean (float): Mean of the speckle noise.
        var (float): Variance of the speckle noise.
        
    Returns:
        numpy.ndarray: Noisy image.
    """
    sigma = var ** 0.5
    gauss = np.random.normal(mean, sigma, image.shape).astype(np.uint8)
    noisy_image = cv2.add(image, image * gauss / 255)
    return noisy_image



def add_poisson_noise(image, lam=30):
    """
    Add Poisson noise to an image.
    
    Parameters:
        image (numpy.ndarray): Input image.
        lam (float): Lambda parameter for Poisson noise.
        
    Returns:
        numpy.ndarray: Noisy image.
    """
    noisy_image = np.random.poisson(image * lam) / lam
    noisy_image = np.clip(noisy_image, 0, 255).astype(np.uint8)
    return noisy_image


def add_noise_to_images(input_dir, output_dir, noise_type='gaussian', **kwargs):
    """
    Add noise to all images in a directory and save them to another directory.
    
    Parameters:
        input_dir (str): Directory containing input images.
        output_dir (str): Directory to save noisy images.
        noise_type (str): Type of noise to add ('gaussian', 'salt_and_pepper', 'speckle', 'poisson').
        **kwargs: Additional parameters for noise functions.
    """
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    for filename in os.listdir(input_dir):
        if filename.endswith(('.png', '.jpg', '.jpeg')):
            image_path = os.path.join(input_dir, filename)
            image = cv2.imread(image_path)

            if noise_type == 'gaussian':
                noisy_image = add_gausian_noise(image, **kwargs)
            elif noise_type == 'salt_and_pepper':
                noisy_image = add_salt_and_pepper_noise(image, **kwargs)
            elif noise_type == 'speckle':
                noisy_image = add_speckle_noise(image, **kwargs)
            elif noise_type == 'poisson':
                noisy_image = add_poisson_noise(image, **kwargs)
            else:
                raise ValueError("Unsupported noise type.")

            output_path = os.path.join(output_dir, filename)
            cv2.imwrite(output_path, noisy_image)
            print(f"Processed {filename} and saved to {output_path}.")


def main():
    parser = argparse.ArgumentParser(description='Add noise to images in a directory.')
    parser.add_argument('input_dir', type=str, help='Input directory containing images.')
    parser.add_argument('output_dir', type=str, help='Output directory to save noisy images.')
    parser.add_argument('--noise_type', type=str, default='gaussian', choices=['gaussian', 'salt_and_pepper', 'speckle', 'poisson'], help='Type of noise to add.')
    parser.add_argument('--mean', type=float, default=0, help='Mean for Gaussian and Speckle noise.')
    parser.add_argument('--var', type=float, default=0.01, help='Variance for Gaussian and Speckle noise.')
    parser.add_argument('--salt_prob', type=float, default=0.01, help='Salt probability for Salt and Pepper noise.')
    parser.add_argument('--pepper_prob', type=float, default=0.01, help='Pepper probability for Salt and Pepper noise.')
    parser.add_argument('--lam', type=float, default=30, help='Lambda parameter for Poisson noise.')

    args = parser.parse_args()

    add_noise_to_images(args.input_dir, args.output_dir, args.noise_type,
                        mean=args.mean,
                        var=args.var,
                        salt_prob=args.salt_prob,
                        pepper_prob=args.pepper_prob,
                        lam=args.lam)
    
if __name__ == '__main__':
    main()  